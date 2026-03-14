/**
 * Recipe工作台组件
 * 整合操作列表、Recipe编辑器和输入输出面板
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Card, Input, Button, Space, Alert, Spin, Empty } from 'antd';
import { PlayCircleOutlined, BugOutlined, ClearOutlined, SaveOutlined } from '@ant-design/icons';
import type { Operation, OperationStep, Recipe } from '../../core/operations';
import { operationRegistry } from '../../core/operations';
import OperationList from '../OperationList/OperationList';
import RecipeEditor from '../RecipeEditor/RecipeEditor';
import { useTranslation } from 'react-i18next';
import { useRecipeExecution } from '../../modules/recipe-tool/hooks/useRecipeExecution';
import styles from './RecipeWorkbench.module.css';

const { Sider, Content } = Layout;
const { TextArea } = Input;

interface RecipeWorkbenchProps {
  /** 初始Recipe */
  initialRecipe?: Recipe;
  /** Recipe保存回调 */
  onSave?: (recipe: Recipe) => void;
  /** Recipe变更回调 */
  onRecipeChange?: (recipe: Recipe) => void;
}

/**
 * Recipe工作台组件
 */
const RecipeWorkbench: React.FC<RecipeWorkbenchProps> = ({
  initialRecipe,
  onSave,
  onRecipeChange,
}) => {
  const { t } = useTranslation();
  const defaultRecipeNameRef = useRef(t('recipeWorkbench.defaultRecipeName', '新建Recipe'));
  const createEmptyRecipe = useCallback((): Recipe => ({
    id: `recipe_${Date.now()}`,
    name: defaultRecipeNameRef.current,
    steps: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }), []);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe || createEmptyRecipe());
  const {
    inputData,
    setInputData,
    executionResult,
    executing,
    dataTypes,
    clearInput,
    resetExecutionResult,
    executeRecipe,
    debugRecipe,
    continueExecution,
  } = useRecipeExecution();

  // 加载操作列表
  useEffect(() => {
    const syncOperations = () => {
      try {
        setOperations(operationRegistry.getAll());
      } catch (error) {
        console.error('加载操作失败:', error);
      } finally {
        setLoading(false);
      }
    };

    syncOperations();
    const unsubscribe = operationRegistry.subscribe(syncOperations);
    return unsubscribe;
  }, []);

  // 同步父组件传入的初始Recipe（加载、导入、清空等场景）
  useEffect(() => {
    if (initialRecipe) {
      setRecipe(initialRecipe);
    } else {
      setRecipe(createEmptyRecipe());
    }
    resetExecutionResult();
  }, [initialRecipe, createEmptyRecipe, resetExecutionResult]);

  // 处理Recipe更新
  const handleRecipeChange = useCallback((newRecipe: Recipe) => {
    setRecipe(newRecipe);
    resetExecutionResult();
    onRecipeChange?.(newRecipe);
  }, [onRecipeChange, resetExecutionResult]);

  // 从左侧操作列表快速添加步骤
  const handleAddOperationFromList = useCallback((operation: Operation) => {
    const newStep: OperationStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      operation,
      params: operation.getParameters().reduce((acc, param) => {
        acc[param.name] = param.defaultValue;
        return acc;
      }, {} as Record<string, unknown>),
      enabled: true,
    };

    const updatedRecipe = {
      ...recipe,
      steps: [...recipe.steps, newStep],
      updatedAt: new Date(),
    };
    setRecipe(updatedRecipe);
    onRecipeChange?.(updatedRecipe);
    resetExecutionResult();
  }, [onRecipeChange, recipe, resetExecutionResult]);

  // 保存Recipe
  const handleSave = useCallback(() => {
    onSave?.(recipe);
  }, [recipe, onSave]);
  const hasEnabledSteps = recipe.steps.some(step => step.enabled);

  // 渲染数据类型检测提示
  const renderDataTypeHints = () => {
    if (dataTypes.length === 0) return null;

    const topTypes = dataTypes.slice(0, 3);
    
    return (
      <div className={styles.dataTypeHints}>
        <div className={styles.dataTypeHintsTitle}>
          {t('recipeWorkbench.detectedDataTypes', '检测到的数据类型')}:
        </div>
        <div className={styles.dataTypeHintsList}>
          {topTypes.map((type, index) => (
            <div key={index} className={styles.dataTypeHint}>
              <span className={styles.dataTypeName}>{type.type}</span>
              <span className={styles.dataTypeConfidence}>
                ({Math.round(type.confidence * 100)}%)
              </span>
              {type.suggestedOperations && (
                <div className={styles.suggestedOperations}>
                  {t('recipeWorkbench.suggestedOperations', '建议操作')}: {type.suggestedOperations.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染执行结果
  const renderExecutionResult = () => {
    if (!executionResult) return null;

    if (!executionResult.isComplete && !executionResult.isBreakpoint) {
          return (
        <Alert
          title={t('recipeWorkbench.executionFailed', '执行失败')}
          description={
            <div>
              <div>{t('recipeWorkbench.executionFailedDesc', 'Recipe执行过程中发生错误，请检查步骤配置')}</div>
              {executionResult.failedStep && (
                <div>
                  {t('recipeWorkbench.failedStep', '失败步骤')}: {executionResult.failedStep.operation.name}
                </div>
              )}
              {executionResult.error && (
                <div>
                  {t('recipeWorkbench.errorDetail', '错误详情')}: {executionResult.error}
                </div>
              )}
            </div>
          }
          type="error"
          showIcon
          className={styles.executionAlert}
        />
      );
    }

    if (executionResult.isBreakpoint) {
      return (
        <Alert
          title={t('recipeWorkbench.breakpointHit', '断点触发')}
          description={t('recipeWorkbench.breakpointHitDesc', '在步骤 "{{stepName}}" 处停止', { 
            stepName: executionResult.nextStep?.operation.name 
          })}
          type="info"
          showIcon
          action={
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                void continueExecution(recipe);
              }}
            >
              {t('recipeWorkbench.continueExecution', '继续执行')}
            </Button>
          }
          className={styles.executionAlert}
        />
      );
    }

    return (
      <div className={styles.executionResult}>
        <div className={styles.executionResultHeader}>
          <h4>{t('recipeWorkbench.executionResult', '执行结果')}</h4>
          <Space>
            <span className={styles.executionTime}>
              {t('recipeWorkbench.executionTime', '执行时间')}: {executionResult.totalExecutionTime}ms
            </span>
          </Space>
        </div>
        <div className={styles.executionSteps}>
          {executionResult.stepResults.map((result, index) => (
            <div
              key={index}
              className={`${styles.executionStep} ${result.success ? styles.stepSuccess : styles.stepError}`}
            >
              <div className={styles.stepHeader}>
                <span className={styles.stepName}>
                  {result.step.operation.name}
                </span>
                <span className={styles.stepTime}>
                  {result.executionTime}ms
                </span>
              </div>
              {!result.success && (
                <div className={styles.stepError}>
                  {t('recipeWorkbench.error', '错误')}: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout className={styles.recipeWorkbench}>
      <Sider width={300} className={styles.operationsSider}>
        <div className={styles.siderHeader}>
          <h3>{t('recipeWorkbench.operations', '操作列表')}</h3>
        </div>
        <div className={styles.siderContent}>
          <OperationList
            operations={operations}
            loading={loading}
            onOperationClick={handleAddOperationFromList}
          />
        </div>
      </Sider>
      
      <Layout className={styles.mainLayout}>
        <Content className={styles.mainContent}>
          <div className={styles.editorSection}>
            <RecipeEditor
              recipe={recipe}
              onRecipeChange={handleRecipeChange}
              onExecute={executeRecipe}
              onDebug={debugRecipe}
              operations={operations}
            />
          </div>
          
          <div className={styles.ioSection}>
            <div className={styles.inputSection}>
              <Card
                title={
                  <div className={styles.sectionTitle}>
                    <span>{t('recipeWorkbench.input', '输入')}</span>
                    <Space>
                      <Button
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        disabled={!onSave}
                      >
                        {t('recipeWorkbench.save', '保存')}
                      </Button>
                      <Button
                        icon={<ClearOutlined />}
                        onClick={clearInput}
                      >
                        {t('recipeWorkbench.clear', '清空')}
                      </Button>
                    </Space>
                  </div>
                }
                className={styles.ioCard}
              >
                <TextArea
                  placeholder={t('recipeWorkbench.inputPlaceholder', '请输入要处理的数据...')}
                  name="recipe-input-data"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  rows={8}
                  className={styles.inputTextarea}
                />
                {renderDataTypeHints()}
              </Card>
            </div>
            
            <div className={styles.outputSection}>
              <Card
                title={
                  <div className={styles.sectionTitle}>
                    <span>{t('recipeWorkbench.output', '输出')}</span>
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => {
                          void executeRecipe(recipe);
                        }}
                        loading={executing}
                        disabled={!inputData.trim() || !hasEnabledSteps}
                      >
                        {t('recipeWorkbench.execute', '执行')}
                      </Button>
                      <Button
                        icon={<BugOutlined />}
                        onClick={() => {
                          const firstEnabledStep = recipe.steps.find(step => step.enabled);
                          void debugRecipe(recipe, firstEnabledStep?.id);
                        }}
                        disabled={!inputData.trim() || !hasEnabledSteps}
                      >
                        {t('recipeWorkbench.debug', '调试')}
                      </Button>
                    </Space>
                  </div>
                }
                className={styles.ioCard}
              >
                {executing ? (
                  <div className={styles.loadingContainer}>
                    <Spin size="large" />
                    <div className={styles.loadingText}>
                      {t('recipeWorkbench.executing', '执行中...')}
                    </div>
                  </div>
                ) : executionResult ? (
                  <div className={styles.outputContent}>
                    <TextArea
                      value={executionResult.data}
                      readOnly
                      rows={8}
                      className={styles.outputTextarea}
                    />
                    {renderExecutionResult()}
                  </div>
                ) : (
                  <Empty
                    description={t('recipeWorkbench.noOutput', '暂无输出')}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default RecipeWorkbench;
