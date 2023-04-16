import { Field } from "payload/dist/fields/config/types";
import { PayloadRequest } from "payload/dist/types";

// aliasing for clarification
export type locale = string;

// fields which can be directly translated
export const translatableFieldTypes = ["text", "textarea", "richText"];
// fields which can be recursively traversed
export const traversableFieldTypes = [
  "group",
  "array",
  "tabs",
  "collapsible",
  "row",
];
// all supported field types combined
export const supportedFieldTypes = [
  ...translatableFieldTypes,
  ...traversableFieldTypes,
];

export type OverrideConfig = {
  endpointName: string;
};

export type AutoI18nConfig = {
  // The translation service/vendor to use. Defaults to `deepl`
  vendor: TranslationVendor;
  // If set to `true` will override present values for `targetlocale`
  overwriteTranslations: boolean;
  // If set to `true` will auto-translate after each document creation or update using payload hooks
  synchronize: boolean;
  // alias the payload locales to country-codes for your vendor
  localeAlias?: Record<string, string>;

  collections?: Array<string>;
  overrides?: Partial<OverrideConfig>;
  endpointConfig?: Partial<RESTConfig>;
};

export type RESTConfig = {
  omitEndpoints: boolean;
  path: string;
};

export type VendorConfig = {
  apiKey: string;
  apiUrl: string;
};

export interface TranslationVendor {
  translate(
    text: string,
    sourceLocale: locale,
    targetLocale: locale
  ): Promise<string>;
}

export type TranslationArgs = {
  value: any;
  targetValue: any;
  field: Field;
  vendor: TranslationVendor;
  sourceLocale: locale;
  targetLocale: locale;
  localeAlias: Record<string, string>;
  overwriteExistingTranslations: boolean;
};
