#!/bin/bash

# Update litellm_model_name.tsx
sed -i '' \
  -e 's/label="LiteLLM Model Name(s)"/label={t("models.addModel.litellmModelName")}/g' \
  -e 's/tooltip="The model name LiteLLM will send to the LLM API"/tooltip={t("models.addModel.litellmModelNameTooltip")}/g' \
  -e 's/placeholder="Select models"/placeholder={t("models.addModel.selectModels")}/g' \
  -e 's/label: "Custom Model Name (Enter below)"/label: t("models.addModel.customModelName")/g' \
  -e 's/label: `All \${selectedProvider} Models (Wildcard)`/label: t("models.addModel.allModelsWildcard").replace("{provider}", selectedProvider)/g' \
  -e 's/message: "Please enter a custom model name."/message: t("models.addModel.customModelNameRequired")/g' \
  -e 's/"Enter Azure deployment name"/{t("models.addModel.enterAzureDeploymentName")}/g' \
  -e 's/"Enter custom model name"/{t("models.addModel.enterCustomModelName")}/g' \
  src/components/add_model/litellm_model_name.tsx

# Update conditional_public_model_name.tsx
sed -i '' \
  -e 's/Public Model Name/{t("models.addModel.publicModelName")}/g' \
  -e 's/LiteLLM Model Name/{t("models.addModel.litellmModelNameColumn")}/g' \
  -e 's/label="Model Mappings"/label={t("models.addModel.modelMappings")}/g' \
  -e 's/tooltip="Map public model names to LiteLLM model names for load balancing"/tooltip={t("models.addModel.modelMappingsTooltip")}/g' \
  -e 's/"At least one model mapping is required"/{t("models.addModel.atLeastOneMappingRequired")}/g' \
  -e 's/"All model mappings must have valid public names"/{t("models.addModel.allMappingsNeedNames")}/g' \
  src/components/add_model/conditional_public_model_name.tsx

# Update AddModelForm.tsx - Add Model button
sed -i '' \
  -e 's/<Button htmlType="submit">Add Model<\/Button>/<Button htmlType="submit">{t("models.addModel.addModelButton")}<\/Button>/g' \
  src/components/add_model/AddModelForm.tsx

echo "i18n updates completed"
