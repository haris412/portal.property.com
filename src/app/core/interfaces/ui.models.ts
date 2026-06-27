export interface BannerData {
  icon: string;
  text: string;
}

export interface ActionChipData {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  muted?: boolean;
}

export interface OptionItem<T extends string = string> {
  value: T;
  label: string;
  icon?: string;
}

export interface SelectableChipItem {
  id: string;
  label: string;
  selected: boolean;
  iconSelected?: string;
  iconUnselected?: string;
}

export interface UploadDropzoneData {
  title: string;
  subtitle: string;
  icon: string;
  accept?: string;
}

export interface StepCardData {
  step: number;
  title: string;
  description: string;
}