/**
 * Recipe工具模块主组件
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, Space, message, Modal } from 'antd';
import { SaveOutlined, ImportOutlined, ExportOutlined, ClearOutlined } from '@ant-design/icons';
import RecipeWorkbench from '../../../components/RecipeWorkbench/RecipeWorkbench';
import { operationRegistry, type Recipe } from '../../../core/operations';
import { useTranslation } from 'react-i18next';
import {
  deserializeRecipe,
  deserializeRecipes,
  serializeRecipe,
  serializeRecipes,
} from '../utils/recipe-serialization';
import styles from './RecipeTool.module.css';

interface RecipeToolProps {
  /** 工具ID */
  toolId?: string;
}

const SAVED_RECIPES_STORAGE_KEY = 'recipe-tool-saved-recipes';
const ACTIVE_RECIPE_ID_STORAGE_KEY = 'recipe-tool-active-recipe-id';

function saveSavedRecipesToStorage(recipes: Recipe[]): void {
  localStorage.setItem(
    SAVED_RECIPES_STORAGE_KEY,
    JSON.stringify(serializeRecipes(recipes))
  );
}

function loadSavedRecipesFromStorage(): Recipe[] {
  try {
    const raw = localStorage.getItem(SAVED_RECIPES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return deserializeRecipes(parsed, operationId => operationRegistry.get(operationId));
  } catch (error) {
    console.warn('Failed to load saved recipes from localStorage:', error);
    return [];
  }
}

function saveActiveRecipeId(recipeId: string | null): void {
  if (recipeId === null) {
    localStorage.removeItem(ACTIVE_RECIPE_ID_STORAGE_KEY);
  } else {
    localStorage.setItem(ACTIVE_RECIPE_ID_STORAGE_KEY, recipeId);
  }
}

function loadActiveRecipeId(): string | null {
  return localStorage.getItem(ACTIVE_RECIPE_ID_STORAGE_KEY);
}

function upsertRecipe(recipes: Recipe[], targetRecipe: Recipe): { updatedRecipes: Recipe[]; updated: boolean } {
  const byIdIndex = recipes.findIndex(saved => saved.id === targetRecipe.id);
  if (byIdIndex >= 0) {
    const updatedRecipes = [...recipes];
    updatedRecipes[byIdIndex] = targetRecipe;
    return { updatedRecipes, updated: true };
  }

  const byNameIndex = recipes.findIndex(saved => saved.name === targetRecipe.name);
  if (byNameIndex >= 0) {
    const updatedRecipes = [...recipes];
    updatedRecipes[byNameIndex] = targetRecipe;
    return { updatedRecipes, updated: true };
  }

  return {
    updatedRecipes: [...recipes, targetRecipe],
    updated: false,
  };
}

/**
 * Recipe工具组件
 */
const RecipeTool: React.FC<RecipeToolProps> = ({ toolId }) => {
  const { t } = useTranslation();
  const initialSavedRecipes = useMemo(() => loadSavedRecipesFromStorage(), []);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(initialSavedRecipes);
  const [recipe, setRecipe] = useState<Recipe | null>(() => {
    const activeRecipeId = loadActiveRecipeId();
    if (!activeRecipeId) return null;
    return initialSavedRecipes.find(saved => saved.id === activeRecipeId) ?? null;
  });
  const [loadModalVisible, setLoadModalVisible] = useState(false);

  useEffect(() => {
    saveSavedRecipesToStorage(savedRecipes);
  }, [savedRecipes]);

  useEffect(() => {
    saveActiveRecipeId(recipe?.id ?? null);
  }, [recipe?.id]);

  // 保存Recipe
  const handleSaveRecipe = useCallback((newRecipe: Recipe) => {
    const recipeToSave: Recipe = {
      ...newRecipe,
      updatedAt: new Date(),
    };

    const { updatedRecipes, updated } = upsertRecipe(savedRecipes, recipeToSave);
    setSavedRecipes(updatedRecipes);
    setRecipe(recipeToSave);
    message.success(updated
      ? t('recipeTool.recipeUpdated', 'Recipe已更新')
      : t('recipeTool.recipeSaved', 'Recipe已保存'));
  }, [savedRecipes, t]);

  // 加载Recipe
  const handleLoadRecipe = useCallback((selectedRecipe: Recipe) => {
    setRecipe(selectedRecipe);
    setLoadModalVisible(false);
    message.success(t('recipeTool.recipeLoaded', 'Recipe已加载'));
  }, [t]);

  // 删除Recipe
  const handleDeleteRecipe = useCallback((recipeId: string) => {
    Modal.confirm({
      title: t('recipeTool.confirmDelete', '确认删除'),
      content: t('recipeTool.confirmDeleteDesc', '确定要删除这个Recipe吗？此操作不可恢复。'),
      okText: t('common.delete', '删除'),
      cancelText: t('common.cancel', '取消'),
      okType: 'danger',
      onOk: () => {
        setSavedRecipes(previousRecipes => previousRecipes.filter(saved => saved.id !== recipeId));
        
        // 如果删除的是当前Recipe，清空当前Recipe
        if (recipe?.id === recipeId) {
          setRecipe(null);
        }
        
        message.success(t('recipeTool.recipeDeleted', 'Recipe已删除'));
      },
    });
  }, [recipe, t]);

  // 导出Recipe
  const handleExportRecipe = useCallback(() => {
    if (!recipe) {
      message.warning(t('recipeTool.noRecipeToExport', '没有可导出的Recipe'));
      return;
    }

    const recipeData = JSON.stringify(serializeRecipe(recipe), null, 2);
    const blob = new Blob([recipeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success(t('recipeTool.recipeExported', 'Recipe已导出'));
  }, [recipe, t]);

  // 导入Recipe
  const handleImportRecipe = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedPayload = JSON.parse(event.target?.result as string);
          const importedRecipe = deserializeRecipe(
            parsedPayload,
            operationId => operationRegistry.get(operationId)
          );
          const normalizedImportedRecipe: Recipe = {
            ...importedRecipe,
            updatedAt: new Date(),
          };
          
          setSavedRecipes(previousRecipes => upsertRecipe(previousRecipes, normalizedImportedRecipe).updatedRecipes);
          setRecipe(normalizedImportedRecipe);
          message.success(t('recipeTool.recipeImported', 'Recipe已导入'));
        } catch (error) {
          message.error(t('recipeTool.importFailed', '导入失败: {{error}}', { 
            error: error instanceof Error ? error.message : String(error) 
          }));
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }, [t]);

  // 清空当前Recipe
  const handleClearRecipe = useCallback(() => {
    Modal.confirm({
      title: t('recipeTool.confirmClear', '确认清空'),
      content: t('recipeTool.confirmClearDesc', '确定要清空当前Recipe吗？此操作不可恢复。'),
      okText: t('common.clear', '清空'),
      cancelText: t('common.cancel', '取消'),
      okType: 'danger',
      onOk: () => {
        setRecipe(null);
        message.success(t('recipeTool.recipeCleared', 'Recipe已清空'));
      },
    });
  }, [t]);

  // 头部保存按钮
  const handleHeaderSave = useCallback(() => {
    if (!recipe) {
      message.warning(t('recipeTool.noRecipeToSave', '没有可保存的Recipe'));
      return;
    }
    handleSaveRecipe(recipe);
  }, [handleSaveRecipe, recipe, t]);

  const handleRecipeStateChange = useCallback((updatedRecipe: Recipe) => {
    setRecipe(updatedRecipe);
  }, []);

  // 渲染加载Recipe模态框
  const renderLoadModal = () => (
    <Modal
      title={t('recipeTool.loadRecipe', '加载Recipe')}
      open={loadModalVisible}
      onCancel={() => setLoadModalVisible(false)}
      footer={null}
      width={800}
    >
      <div className={styles.loadModalContent}>
        {savedRecipes.length === 0 ? (
          <div className={styles.noSavedRecipes}>
            {t('recipeTool.noSavedRecipes', '没有保存的Recipe')}
          </div>
        ) : (
          <div className={styles.savedRecipesList}>
            {savedRecipes.map((savedRecipe) => (
              <div key={savedRecipe.id} className={styles.savedRecipeItem}>
                <div className={styles.savedRecipeInfo}>
                  <div className={styles.savedRecipeName}>
                    {savedRecipe.name}
                  </div>
                  <div className={styles.savedRecipeMeta}>
                    {t('recipeTool.stepsCount', '步骤数')}: {savedRecipe.steps.length} | 
                    {t('recipeTool.updatedAt', '更新时间')}: {new Date(savedRecipe.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className={styles.savedRecipeActions}>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleLoadRecipe(savedRecipe)}
                  >
                    {t('common.load', '加载')}
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => handleDeleteRecipe(savedRecipe.id)}
                  >
                    {t('common.delete', '删除')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );

  return (
    <div className={styles.recipeTool} data-tool-id={toolId ?? 'recipe'}>
      <div className={styles.recipeToolHeader}>
        <Space>
          <Button
            icon={<SaveOutlined />}
            onClick={handleHeaderSave}
            disabled={!recipe}
          >
            {t('recipeTool.save', '保存')}
          </Button>
          <Button
            icon={<ImportOutlined />}
            onClick={handleImportRecipe}
          >
            {t('recipeTool.import', '导入')}
          </Button>
          <Button
            icon={<ExportOutlined />}
            onClick={handleExportRecipe}
            disabled={!recipe}
          >
            {t('recipeTool.export', '导出')}
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClearRecipe}
            disabled={!recipe}
          >
            {t('recipeTool.clear', '清空')}
          </Button>
          <Button
            onClick={() => setLoadModalVisible(true)}
            disabled={savedRecipes.length === 0}
          >
            {t('recipeTool.load', '加载')} ({savedRecipes.length})
          </Button>
        </Space>
      </div>
      
      <div className={styles.recipeToolContent}>
        <RecipeWorkbench
          initialRecipe={recipe || undefined}
          onSave={handleSaveRecipe}
          onRecipeChange={handleRecipeStateChange}
        />
      </div>
      
      {renderLoadModal()}
    </div>
  );
};

export default RecipeTool;
