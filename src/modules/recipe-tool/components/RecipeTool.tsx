/**
 * Recipe工具模块主组件
 */

import React, { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { Button, Space, message, Modal } from 'antd';
import { SaveOutlined, ImportOutlined, ExportOutlined, ClearOutlined } from '@ant-design/icons';
import { operationRegistry, type Recipe } from '../../../core/operations';
import { ensureOperationsInitialized } from '../../../core/operations/init';
import { useTranslation } from 'react-i18next';
import {
  deserializeRecipe,
  serializeRecipe,
} from '../utils/recipe-serialization';
import {
  getInitialRecipeState,
  loadSavedRecipesFromStorage,
  loadActiveRecipeId,
  saveActiveRecipeId,
  saveSavedRecipesToStorage,
  upsertRecipe,
} from '../utils/recipe-storage';
import styles from './RecipeTool.module.css';

const RecipeWorkbench = lazy(() => import('../../../components/RecipeWorkbench/RecipeWorkbench'));

interface RecipeToolProps {
  /** 工具ID */
  toolId?: string;
}

/**
 * Recipe工具组件
 */
const RecipeTool: React.FC<RecipeToolProps> = ({ toolId }) => {
  const { t } = useTranslation();
  const [operationsReady, setOperationsReady] = useState(
    import.meta.vitest || import.meta.env.MODE === 'test'
  );
  const [{ savedRecipes: initialSavedRecipes, activeRecipe: initialRecipe }] = useState(() =>
    getInitialRecipeState(operationsReady, (operationId) => operationRegistry.get(operationId))
  );
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(initialSavedRecipes);
  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe);
  const [loadModalVisible, setLoadModalVisible] = useState(false);

  useEffect(() => {
    if (operationsReady) {
      return;
    }

    let active = true;

      void ensureOperationsInitialized().then(() => {
        if (!active) {
          return;
        }

        const loadedRecipes = loadSavedRecipesFromStorage((operationId) => operationRegistry.get(operationId));
        setSavedRecipes(loadedRecipes);

        const activeRecipeId = loadActiveRecipeId();
      setRecipe(
        activeRecipeId
          ? loadedRecipes.find(saved => saved.id === activeRecipeId) ?? null
          : null
      );
      setOperationsReady(true);
    });

    return () => {
      active = false;
    };
  }, [operationsReady]);

  useEffect(() => {
    if (!operationsReady) {
      return;
    }
    saveSavedRecipesToStorage(savedRecipes);
  }, [operationsReady, savedRecipes]);

  useEffect(() => {
    if (!operationsReady) {
      return;
    }
    saveActiveRecipeId(recipe?.id ?? null);
  }, [operationsReady, recipe?.id]);

  // 保存Recipe
  const handleSaveRecipe = useCallback((newRecipe: Recipe) => {
    const recipeToSave: Recipe = {
      ...newRecipe,
      updatedAt: new Date(),
    };

    const { updatedRecipes, updated, nameConflictResolved, resolvedRecipe } = upsertRecipe(savedRecipes, recipeToSave);
    setSavedRecipes(updatedRecipes);
    setRecipe(resolvedRecipe);
    message.success(nameConflictResolved
      ? t(
          'recipeTool.recipeSavedRenamed',
          'Recipe已保存，名称冲突，已自动重命名为 "{{name}}"',
          { name: resolvedRecipe.name }
        )
      : updated
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

          setSavedRecipes((previousRecipes) => {
            const result = upsertRecipe(previousRecipes, normalizedImportedRecipe);
            setRecipe(result.resolvedRecipe);
            message.success(result.nameConflictResolved
              ? t(
                  'recipeTool.recipeImportedRenamed',
                  'Recipe已导入，名称冲突，已自动重命名为 "{{name}}"',
                  { name: result.resolvedRecipe.name }
                )
              : t('recipeTool.recipeImported', 'Recipe已导入'));
            return result.updatedRecipes;
          });
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

  if (!operationsReady) {
    return (
      <div className={styles.recipeTool} data-tool-id={toolId ?? 'recipe'}>
        <div className={styles.recipeToolContent}>
          正在初始化 Recipe 操作...
        </div>
      </div>
    );
  }

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
        <Suspense fallback={null}>
          <RecipeWorkbench
            initialRecipe={recipe || undefined}
            onSave={handleSaveRecipe}
            onRecipeChange={handleRecipeStateChange}
          />
        </Suspense>
      </div>
      
      {renderLoadModal()}
    </div>
  );
};

export default RecipeTool;
