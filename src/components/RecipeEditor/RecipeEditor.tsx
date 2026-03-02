/**
 * Recipe编辑器组件
 * 用于可视化编辑操作链
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Dropdown, 
  Modal, 
  Form, 
  Input, 
  Switch, 
  Select,
  Divider,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SettingOutlined, 
  PlayCircleOutlined,
  PauseCircleOutlined,
  BugOutlined,
  DragOutlined,
  CopyOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';
import type { Operation, OperationStep, Recipe } from '../../core/operations';
import { getOperationIcon } from '../../core/operations/icons';
import { useTranslation } from 'react-i18next';
import styles from './RecipeEditor.module.css';

interface RecipeEditorProps {
  /** 当前Recipe */
  recipe: Recipe;
  /** Recipe更新回调 */
  onRecipeChange: (recipe: Recipe) => void;
  /** 执行Recipe回调 */
  onExecute: (recipe: Recipe) => void;
  /** 调试Recipe回调 */
  onDebug: (recipe: Recipe, stepId: string) => void;
  /** 操作列表 */
  operations: Operation[];
}

/**
 * Recipe编辑器组件
 */
const RecipeEditor: React.FC<RecipeEditorProps> = ({
  recipe,
  onRecipeChange,
  onExecute,
  onDebug,
  operations,
}) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<OperationStep | null>(null);
  const [form] = Form.useForm();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // 添加操作步骤
  const handleAddOperation = useCallback((operation: Operation) => {
    const newStep: OperationStep = {
      id: `step_${Date.now()}`,
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

    onRecipeChange(updatedRecipe);
  }, [recipe, onRecipeChange]);

  // 删除操作步骤
  const handleDeleteStep = useCallback((stepId: string) => {
    const updatedRecipe = {
      ...recipe,
      steps: recipe.steps.filter(step => step.id !== stepId),
      updatedAt: new Date(),
    };

    onRecipeChange(updatedRecipe);
  }, [recipe, onRecipeChange]);

  // 切换步骤启用状态
  const handleToggleStep = useCallback((stepId: string, enabled: boolean) => {
    const updatedRecipe = {
      ...recipe,
      steps: recipe.steps.map(step =>
        step.id === stepId ? { ...step, enabled } : step
      ),
      updatedAt: new Date(),
    };

    onRecipeChange(updatedRecipe);
  }, [recipe, onRecipeChange]);

  // 切换断点状态
  const handleToggleBreakpoint = useCallback((stepId: string, isBreakpoint: boolean) => {
    const updatedRecipe = {
      ...recipe,
      steps: recipe.steps.map(step =>
        step.id === stepId ? { ...step, isBreakpoint } : step
      ),
      updatedAt: new Date(),
    };

    onRecipeChange(updatedRecipe);
  }, [recipe, onRecipeChange]);

  // 编辑步骤参数
  const handleEditStep = useCallback((step: OperationStep) => {
    setCurrentStep(step);
    form.setFieldsValue(step.params);
    setModalVisible(true);
  }, [form]);

  // 保存步骤参数
  const handleSaveStep = useCallback(() => {
    if (!currentStep) return;

    form.validateFields().then(values => {
      const updatedRecipe = {
        ...recipe,
        steps: recipe.steps.map(step =>
          step.id === currentStep.id ? { ...step, params: values } : step
        ),
        updatedAt: new Date(),
      };

      onRecipeChange(updatedRecipe);
      setModalVisible(false);
      setCurrentStep(null);
      form.resetFields();
    });
  }, [currentStep, recipe, onRecipeChange, form]);

  // 复制步骤
  const handleDuplicateStep = useCallback((step: OperationStep) => {
    const newStep: OperationStep = {
      ...step,
      id: `step_${Date.now()}`,
    };

    const stepIndex = recipe.steps.findIndex(s => s.id === step.id);
    const updatedRecipe = {
      ...recipe,
      steps: [
        ...recipe.steps.slice(0, stepIndex + 1),
        newStep,
        ...recipe.steps.slice(stepIndex + 1),
      ],
      updatedAt: new Date(),
    };

    onRecipeChange(updatedRecipe);
  }, [recipe, onRecipeChange]);

  // 移动步骤
  const handleMoveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
    const stepIndex = recipe.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (newIndex < 0 || newIndex >= recipe.steps.length) return;

    const newSteps = [...recipe.steps];
    [newSteps[stepIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[stepIndex]];

    const updatedRecipe = {
      ...recipe,
      steps: newSteps,
      updatedAt: new Date(),
    };

    onRecipeChange(updatedRecipe);
  }, [recipe, onRecipeChange]);

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  // 拖拽结束
  const handleDragEnter = (e: React.DragEvent, index: number) => {
    dragOverItem.current = index;
    e.preventDefault();
  };

  // 拖拽放置
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const dragItemIndex = dragItem.current;
    const dragOverItemIndex = dragOverItem.current;

    if (dragItemIndex !== dragOverItemIndex) {
      const newSteps = [...recipe.steps];
      const draggedItem = newSteps[dragItemIndex];
      newSteps.splice(dragItemIndex, 1);
      newSteps.splice(dragOverItemIndex, 0, draggedItem);

      const updatedRecipe = {
        ...recipe,
        steps: newSteps,
        updatedAt: new Date(),
      };

      onRecipeChange(updatedRecipe);
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  // 渲染参数表单
  const renderParameterForm = () => {
    if (!currentStep) return null;

    const parameters = currentStep.operation.getParameters();
    if (parameters.length === 0) {
      return (
        <div className={styles.noParameters}>
          {t('recipeEditor.noParameters', '该操作没有参数')}
        </div>
      );
    }

    return parameters.map(param => {
      let input;
      switch (param.type) {
        case 'boolean':
          input = <Switch />;
          break;
        case 'select':
          input = (
            <Select>
              {param.options?.map(option => (
                <Select.Option key={String(option.value)} value={option.value as string | number}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          );
          break;
        case 'multiselect':
          input = (
            <Select mode="multiple">
              {param.options?.map(option => (
                <Select.Option key={String(option.value)} value={option.value as string | number}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          );
          break;
        case 'number':
          input = <Input type="number" />;
          break;
        case 'string':
        default:
          input = param.name.includes('password') ? 
            <Input.Password /> : 
            <Input />;
          break;
      }

      return (
        <Form.Item
          key={param.name}
          name={param.name}
          label={param.description || param.name}
          rules={param.required ? [{ required: true }] : []}
        >
          {input}
        </Form.Item>
      );
    });
  };

  return (
    <div className={styles.recipeEditor}>
      <div className={styles.recipeHeader}>
        <h3 className={styles.recipeTitle}>
          {recipe.name || t('recipeEditor.untitledRecipe', '未命名Recipe')}
        </h3>
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => onExecute(recipe)}
          >
            {t('recipeEditor.execute', '执行')}
          </Button>
          <Button
            icon={<BugOutlined />}
            onClick={() => onDebug(recipe, recipe.steps[0]?.id)}
            disabled={recipe.steps.length === 0}
          >
            {t('recipeEditor.debug', '调试')}
          </Button>
          <Dropdown menu={{ items: operations.map(operation => ({
            key: operation.id,
            icon: typeof operation.icon === 'string' ? getOperationIcon(operation.icon) : operation.icon,
            label: operation.name,
            onClick: () => handleAddOperation(operation),
          })) }} placement="bottomRight">
            <Button icon={<PlusOutlined />}>
              {t('recipeEditor.addOperation', '添加操作')}
            </Button>
          </Dropdown>
        </Space>
      </div>

      <div className={styles.stepsContainer}>
        {recipe.steps.length === 0 ? (
          <Empty
            description={t('recipeEditor.noSteps', '还没有添加任何操作步骤')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Dropdown menu={{ items: operations.map(operation => ({
              key: operation.id,
              icon: typeof operation.icon === 'string' ? getOperationIcon(operation.icon) : operation.icon,
              label: operation.name,
              onClick: () => handleAddOperation(operation),
            })) }} placement="bottomCenter">
              <Button type="primary" icon={<PlusOutlined />}>
                {t('recipeEditor.addFirstOperation', '添加第一个操作')}
              </Button>
            </Dropdown>
          </Empty>
        ) : (
          <div className={styles.stepsList}>
            {recipe.steps.map((step, index) => (
              <Card
                key={step.id}
                className={`${styles.stepCard} ${!step.enabled ? styles.stepDisabled : ''} ${step.isBreakpoint ? styles.stepBreakpoint : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                size="small"
              >
                <div className={styles.stepHeader}>
                  <div className={styles.stepInfo}>
                    <div className={styles.stepIcon}>
                      <DragOutlined className={styles.dragHandle} />
                      {typeof step.operation.icon === 'string' ? getOperationIcon(step.operation.icon) : step.operation.icon}
                    </div>
                    <div className={styles.stepDetails}>
                      <div className={styles.stepName}>
                        {step.operation.name}
                        {step.isBreakpoint && (
                          <span className={styles.breakpointBadge}>
                            <BugOutlined />
                          </span>
                        )}
                      </div>
                      <div className={styles.stepDescription}>
                        {step.operation.description}
                      </div>
                    </div>
                  </div>
                  <div className={styles.stepActions}>
                    <Switch
                      size="small"
                      checked={step.enabled}
                      onChange={(checked) => handleToggleStep(step.id, checked)}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={step.isBreakpoint ? <PauseCircleOutlined /> : <BugOutlined />}
                      onClick={() => handleToggleBreakpoint(step.id, !step.isBreakpoint)}
                      className={step.isBreakpoint ? styles.breakpointButton : ''}
                    />
                    <Dropdown menu={{ 
                      items: [
                        {
                          key: 'edit',
                          icon: <SettingOutlined />,
                          label: t('recipeEditor.editStep', '编辑参数'),
                          onClick: () => handleEditStep(step),
                        },
                        {
                          key: 'duplicate',
                          icon: <CopyOutlined />,
                          label: t('recipeEditor.duplicateStep', '复制步骤'),
                          onClick: () => handleDuplicateStep(step),
                        },
                        {
                          key: 'move-up',
                          icon: <UpOutlined />,
                          label: t('recipeEditor.moveUp', '上移'),
                          onClick: () => handleMoveStep(step.id, 'up'),
                          disabled: recipe.steps[0]?.id === step.id,
                        },
                        {
                          key: 'move-down',
                          icon: <DownOutlined />,
                          label: t('recipeEditor.moveDown', '下移'),
                          onClick: () => handleMoveStep(step.id, 'down'),
                          disabled: recipe.steps[recipe.steps.length - 1]?.id === step.id,
                        },
                        {
                          type: 'divider',
                        },
                        {
                          key: 'delete',
                          icon: <DeleteOutlined />,
                          label: t('recipeEditor.deleteStep', '删除步骤'),
                          danger: true,
                          onClick: () => handleDeleteStep(step.id),
                        },
                      ]
                    }} trigger={['click']}>
                      <Button type="text" size="small" icon={<SettingOutlined />} />
                    </Dropdown>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        title={t('recipeEditor.editStepTitle', '编辑步骤参数')}
        open={modalVisible}
        onOk={handleSaveStep}
        onCancel={() => {
          setModalVisible(false);
          setCurrentStep(null);
          form.resetFields();
        }}
        width={600}
      >
        {currentStep && (
          <div className={styles.stepEditForm}>
            <div className={styles.stepEditHeader}>
              <div className={styles.stepEditIcon}>
                {typeof currentStep.operation.icon === 'string' ? getOperationIcon(currentStep.operation.icon) : currentStep.operation.icon}
              </div>
              <div className={styles.stepEditInfo}>
                <div className={styles.stepEditName}>
                  {currentStep.operation.name}
                </div>
                <div className={styles.stepEditDescription}>
                  {currentStep.operation.description}
                </div>
              </div>
            </div>
            <Divider />
            <Form form={form} layout="vertical">
              {renderParameterForm()}
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecipeEditor;
