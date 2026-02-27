import { Text, TextInput } from "@tremor/react";
import { Button as AntButton, Form, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";
import NumericalInput from "../shared/numerical_input";
import { useLanguage } from "@/contexts/LanguageContext";

interface BaseMember {
  user_email?: string;
  user_id?: string;
  role: string;
}

interface ModalConfig {
  title: string;
  roleOptions: Array<{
    label: string;
    value: string;
  }>;
  defaultRole?: string;
  showEmail?: boolean;
  showUserId?: boolean;
  additionalFields?: Array<{
    name: string;
    label: string | React.ReactNode;
    type: "input" | "select" | "numerical";
    options?: Array<{ label: string; value: string }>;
    rules?: any[];
    step?: number;
    min?: number;
    placeholder?: string;
  }>;
}

interface MemberModalProps<T extends BaseMember> {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: T) => void;
  initialData?: T | null;
  mode: "add" | "edit";
  config: ModalConfig;
}

const MemberModal = <T extends BaseMember>({
  visible,
  onCancel,
  onSubmit,
  initialData,
  mode,
  config,
}: MemberModalProps<T>) => {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("Initial Data:", initialData);

  // Reset form and set initial values when modal becomes visible or initialData changes
  useEffect(() => {
    if (visible) {
      if (mode === "edit" && initialData) {
        // For edit mode, use the initialData values
        const formValues = {
          ...initialData,
          // Ensure role is set correctly for editing
          role: initialData.role || config.defaultRole,
          // Keep numeric values as numbers for NumericalInput components
          max_budget_in_team: (initialData as any).max_budget_in_team || null,
          tpm_limit: (initialData as any).tpm_limit || null,
          rpm_limit: (initialData as any).rpm_limit || null,
        };
        console.log("Setting form values:", formValues);
        form.setFieldsValue(formValues);
      } else {
        // For add mode, reset to defaults
        form.resetFields();
        form.setFieldsValue({
          role: config.defaultRole || config.roleOptions[0]?.value,
        });
      }
    }
  }, [visible, initialData, mode, form, config.defaultRole, config.roleOptions]);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      // Trim string values and clean up form data
      const formData = Object.entries(values).reduce((acc, [key, value]) => {
        if (typeof value === "string") {
          const trimmedValue = value.trim();
          // For empty strings on optional numeric fields, set to null
          if (trimmedValue === "" && (key === "max_budget_in_team" || key === "tpm_limit" || key === "rpm_limit")) {
            return { ...acc, [key]: null };
          }
          return { ...acc, [key]: trimmedValue };
        }
        // For numeric values from NumericalInput, use as-is (already numbers)
        return { ...acc, [key]: value };
      }, {}) as T;

      console.log("Submitting form data:", formData);
      await Promise.resolve(onSubmit(formData));
      form.resetFields();
      // NotificationsManager.success(`Successfully ${mode === 'add' ? 'added' : 'updated'} member`);
    } catch (error) {
      // NotificationManager.fromBackend('Failed to submit form');
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get role label from value
  const getRoleLabel = (value: string) => {
    return config.roleOptions.find((option) => option.value === value)?.label || value;
  };

  const renderField = (field: {
    name: string;
    label: string | React.ReactNode;
    type: "input" | "select" | "numerical";
    options?: Array<{ label: string; value: string }>;
    rules?: any[];
    step?: number;
    min?: number;
    placeholder?: string;
  }) => {
    switch (field.type) {
      case "input":
        return <TextInput placeholder={field.placeholder} />;
      case "numerical":
        return (
          <NumericalInput
            step={field.step || 1}
            min={field.min || 0}
            style={{ width: "100%" }}
            placeholder={field.placeholder || "Enter a numerical value"}
          />
        );
      case "select":
        return (
          <Select>
            {field.options?.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={config.title || (mode === "add" ? t("teamDetail.memberPermissions.modal.addMember") : t("teamDetail.memberPermissions.modal.editMember"))}
      open={visible}
      width={1000}
      footer={null}
      onCancel={onCancel}
    >
      <Form form={form} onFinish={handleSubmit} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        {config.showEmail && (
          <Form.Item
            label={t("teamDetail.memberPermissions.modal.userEmail")}
            name="user_email"
            className="mb-4"
            rules={[{ type: "email", message: t("teamDetail.memberPermissions.modal.validEmail") }]}
          >
            <TextInput placeholder="user@example.com" />
          </Form.Item>
        )}

        {config.showEmail && config.showUserId && (
          <div className="text-center mb-4">
            <Text>{t("teamDetail.memberPermissions.modal.or")}</Text>
          </div>
        )}

        {config.showUserId && (
          <Form.Item label={t("teamDetail.memberPermissions.modal.userId")} name="user_id" className="mb-4">
            <TextInput placeholder="user_123" />
          </Form.Item>
        )}

        <Form.Item
          label={
            <div className="flex items-center gap-2">
              <span>{t("teamDetail.memberPermissions.modal.role")}</span>
              {mode === "edit" && initialData && (
                <span className="text-gray-500 text-sm">({t("teamDetail.memberPermissions.modal.current")}{getRoleLabel(initialData.role)})</span>
              )}
            </div>
          }
          name="role"
          className="mb-4"
          rules={[{ required: true, message: t("teamDetail.memberPermissions.modal.roleRequired") }]}
        >
          <Select>
            {mode === "edit" && initialData
              ? [
                  // Current role first
                  ...config.roleOptions.filter((option) => option.value === initialData.role),
                  // Then all other roles
                  ...config.roleOptions.filter((option) => option.value !== initialData.role),
                ].map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))
              : config.roleOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
          </Select>
        </Form.Item>

        {config.additionalFields?.map((field) => (
          <Form.Item key={field.name} label={field.label} name={field.name} className="mb-4" rules={field.rules}>
            {renderField(field)}
          </Form.Item>
        ))}

        <div className="text-right mt-6">
          <AntButton onClick={onCancel} className="mr-2" disabled={isSubmitting}>
            {t("teamDetail.memberPermissions.modal.cancel")}
          </AntButton>
          <AntButton type="default" htmlType="submit" loading={isSubmitting}>
            {mode === "add"
              ? isSubmitting
                ? t("teamDetail.memberPermissions.modal.adding")
                : t("teamDetail.memberPermissions.modal.addMember")
              : isSubmitting
                ? t("teamDetail.memberPermissions.modal.saving")
                : t("teamDetail.memberPermissions.saveChanges")}
          </AntButton>
        </div>
      </Form>
    </Modal>
  );
};

export default MemberModal;
