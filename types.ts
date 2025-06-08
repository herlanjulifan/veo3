export interface PromptState {
  subjek: string;
  aksi: string;
  ekspresi: string;
  tempat: string;
  waktu: string;
  gerakanKamera: string;
  pencahayaan: string;
  gayaVideo: string;
  suasanaVideo: string;
  suaraMusik: string;
  kalimatYangDiucapkan: string;
  detailTambahan: string;
  negativePrompt: string;
}

export interface OptionType {
  value: string;
  label: string;
}

export interface PromptElement {
  id: keyof PromptState | string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[] | OptionType[];
  rows?: number;
}
