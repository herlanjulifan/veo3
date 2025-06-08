import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PromptState, PromptElement, OptionType } from './types';
import {
  WAKTU_OPTIONS, GERAKAN_KAMERA_OPTIONS, PENCAHAYAAN_OPTIONS,
  GAYA_VIDEO_OPTIONS, SUASANA_VIDEO_OPTIONS, DEFAULT_PROMPT_STATE
} from './constants';
import TextAreaInput from './components/TextAreaInput';
import SelectInput from './components/SelectInput';
import TextInput from './components/TextInput';
import { SparklesIcon, DocumentDuplicateIcon, CheckCircleIcon, LanguageIcon, ArrowPathIcon } from './components/Icons';

// Ensure API_KEY is available. In a real build process, this would be handled by environment variables.
// For this environment, we assume process.env.API_KEY is set.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY is not set. Translation functionality will be disabled.");
}
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const App: React.FC = () => {
  const [promptInputs, setPromptInputs] = useState<PromptState>(DEFAULT_PROMPT_STATE);
  const [generatedIndonesianPrompt, setGeneratedIndonesianPrompt] = useState<string>("");
  const [generatedEnglishPrompt, setGeneratedEnglishPrompt] = useState<string>("");
  const [isCopiedIndo, setIsCopiedIndo] = useState<boolean>(false);
  const [isCopiedEng, setIsCopiedEng] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const handleInputChange = useCallback(<K extends keyof PromptState>(field: K, value: PromptState[K]) => {
    setPromptInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleIndonesianPromptChange = useCallback((value: string) => {
    setGeneratedIndonesianPrompt(value);
  }, []);

  const generateDetailedIndonesianPrompt = useCallback((): string => {
    const {
      subjek, aksi, ekspresi, tempat, waktu, gerakanKamera, pencahayaan,
      gayaVideo, suasanaVideo, suaraMusik, kalimatYangDiucapkan, detailTambahan, negativePrompt
    } = promptInputs;

    let parts: string[] = [];

    // Scene Core
    let sceneCore = "Visualisasikan sebuah adegan";
    if (subjek.trim()) {
      sceneCore += ` yang menampilkan ${subjek.trim()}`;
      if (aksi.trim()) sceneCore += ` sedang ${aksi.trim()}`;
      if (ekspresi.trim()) sceneCore += ` dengan ekspresi ${ekspresi.trim()}`;
    } else {
      sceneCore += " yang menakjubkan dan penuh detail";
    }
    parts.push(sceneCore + ".");

    // Setting
    if (tempat.trim()) parts.push(`Berlatar di ${tempat.trim()}`);
    if (waktu.trim()) parts.push(`pada ${waktu.trim()}.`);
    else if (tempat.trim()) parts.push("."); // End sentence if only place is specified

    // Visual Style
    let visualStyleParts = [];
    if (gayaVideo.trim()) visualStyleParts.push(`dalam gaya video ${gayaVideo.trim()}`);
    if (pencahayaan.trim()) visualStyleParts.push(`dengan pencahayaan ${pencahayaan.trim()}`);
    if (gerakanKamera.trim()) visualStyleParts.push(`menggunakan gerakan kamera ${gerakanKamera.trim().replace(/_/g, ' ')}`);
    if (suasanaVideo.trim()) visualStyleParts.push(`menciptakan suasana ${suasanaVideo.trim()}`);
    
    if (visualStyleParts.length > 0) {
      parts.push(visualStyleParts.join(", ") + ".");
    }
    
    // Audio and Dialogue
    if (suaraMusik.trim()) parts.push(`Diiringi oleh ${suaraMusik.trim()}.`);
    if (kalimatYangDiucapkan.trim()) {
      // IMPORTANT: This is where we mark the dialogue for non-translation
      parts.push(`Terdapat dialog: {{${kalimatYangDiucapkan.trim()}}}.`);
    }

    // Additional Details
    if (detailTambahan.trim()) parts.push(`Detail tambahan: ${detailTambahan.trim()}.`);

    // Enhancers & Negative Prompt
    parts.push("Pastikan hasil akhir berkualitas tinggi, sangat detail, fokus tajam, dan secara visual memukau.");
    if (negativePrompt.trim()) {
      parts.push(`Hindari elemen seperti: ${negativePrompt.trim()}.`);
    }

    return parts.filter(part => part.trim() !== "").join(" ");
  }, [promptInputs]);

  const translateToEnglish = useCallback(async (indonesianText: string) => {
    if (!ai) {
      setTranslationError("Layanan terjemahan tidak tersedia (API Key belum diatur).");
      setGeneratedEnglishPrompt("Translation service unavailable.");
      return;
    }
    if (!indonesianText.trim()) {
      setGeneratedEnglishPrompt("");
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);
    setGeneratedEnglishPrompt("");

    const translationPrompt = `Translate the following Indonesian text to English. IMPORTANT: If you find a part of the text enclosed in double curly braces like {{this part}}, keep that specific part exactly as it is, without translating it. Only translate the text outside of the curly braces. Text to translate: ${indonesianText}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: translationPrompt,
      });
      const englishText = response.text;
      setGeneratedEnglishPrompt(englishText);
    } catch (error) {
      console.error("Translation API error:", error);
      setTranslationError("Gagal menerjemahkan prompt. Silakan coba lagi.");
      setGeneratedEnglishPrompt("Error during translation.");
    } finally {
      setIsTranslating(false);
    }
  }, []);
  
  const handleCraftPrompt = useCallback(() => {
    const indoPrompt = generateDetailedIndonesianPrompt();
    setGeneratedIndonesianPrompt(indoPrompt);
    setIsCopiedIndo(false);
    setIsCopiedEng(false);
    translateToEnglish(indoPrompt);
  }, [generateDetailedIndonesianPrompt, translateToEnglish]);

  const handleRetranslate = useCallback(() => {
    translateToEnglish(generatedIndonesianPrompt);
  }, [generatedIndonesianPrompt, translateToEnglish]);


  const handleCopyToClipboard = useCallback((text: string, type: 'indo' | 'eng') => {
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        if (type === 'indo') {
          setIsCopiedIndo(true);
          setTimeout(() => setIsCopiedIndo(false), 2000);
        } else {
          setIsCopiedEng(true);
          setTimeout(() => setIsCopiedEng(false), 2000);
        }
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  }, []);

  const inputElements: PromptElement[] = [
    { id: 'subjek', label: 'Subjek Utama', type: 'text', placeholder: 'Mis: seekor kucing oranye, dua sahabat pena' },
    { id: 'aksi', label: 'Aksi/Kegiatan', type: 'text', placeholder: 'Mis: menjelajahi hutan ajaib, membaca buku di kafe' },
    { id: 'ekspresi', label: 'Ekspresi/Emosi (Opsional)', type: 'text', placeholder: 'Mis: gembira, penasaran, termenung' },
    { id: 'tempat', label: 'Tempat/Latar', type: 'text', placeholder: 'Mis: perpustakaan tua, planet Mars, kafe pinggir jalan' },
    { id: 'waktu', label: 'Waktu', type: 'select', options: WAKTU_OPTIONS },
    { id: 'gerakanKamera', label: 'Gerakan Kamera', type: 'select', options: GERAKAN_KAMERA_OPTIONS },
    { id: 'pencahayaan', label: 'Pencahayaan', type: 'select', options: PENCAHAYAAN_OPTIONS },
    { id: 'gayaVideo', label: 'Gaya Video', type: 'select', options: GAYA_VIDEO_OPTIONS },
    { id: 'suasanaVideo', label: 'Suasana Video', type: 'select', options: SUASANA_VIDEO_OPTIONS },
    { id: 'suaraMusik', label: 'Suara/Musik (Opsional)', type: 'text', placeholder: 'Mis: musik lo-fi tenang, suara ombak, soundtrack epik' },
    { id: 'kalimatYangDiucapkan', label: 'Kalimat yang Diucapkan (Opsional)', type: 'text', placeholder: 'Mis: "Ini luar biasa!", "Apa yang terjadi di sana?"' },
    { id: 'detailTambahan', label: 'Detail Tambahan (Opsional)', type: 'textarea', placeholder: 'Mis: fokus pada detail mata subjek, sertakan partikel debu beterbangan', rows: 3 },
    { id: 'negativePrompt', label: 'Prompt Negatif (Hal yang dihindari)', type: 'text', placeholder: 'Mis: buram, kualitas rendah, teks, manusia' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <header className="w-full max-w-7xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-sky-400 mb-2 flex items-center justify-center space-x-3">
          <SparklesIcon className="w-10 h-10 text-yellow-400" />
          <span>Veo 3 Prompt Crafter</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base">
          Buat prompt video AI yang terstruktur, detail, dan efektif dalam Bahasa Indonesia dan Inggris.
        </p>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column: Inputs */}
        <section className="bg-slate-800 p-6 rounded-xl shadow-2xl space-y-5 border border-slate-700">
          <h2 className="text-2xl font-semibold text-sky-300 border-b border-slate-700 pb-3 mb-6">Elemen Prompt</h2>
          {inputElements.map(el => {
            const commonProps = {
              id: el.id,
              label: el.label,
              value: promptInputs[el.id as keyof PromptState],
              onChange: (value: string) => handleInputChange(el.id as keyof PromptState, value),
            };
            if (el.type === 'textarea') {
              return <TextAreaInput key={el.id} {...commonProps} placeholder={el.placeholder} rows={el.rows} />;
            }
            if (el.type === 'select') {
              return <SelectInput key={el.id} {...commonProps} options={el.options || []} />;
            }
            return <TextInput key={el.id} {...commonProps} placeholder={el.placeholder} />;
          })}
          <button
            onClick={handleCraftPrompt}
            className="w-full mt-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-150 flex items-center justify-center text-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
            aria-label="Buat Prompt Bahasa Indonesia dan Terjemahkan ke Bahasa Inggris"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Buat Prompt & Terjemahkan
          </button>
        </section>

        {/* Right Column: Outputs */}
        <section className="space-y-6 lg:sticky lg:top-8 self-start">
          {/* Indonesian Prompt Output */}
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-sky-300">Prompt (Bahasa Indonesia - Bisa Diedit)</h2>
              {generatedIndonesianPrompt && (
                <button
                  onClick={() => handleCopyToClipboard(generatedIndonesianPrompt, 'indo')}
                  title="Salin Prompt Bahasa Indonesia"
                  className={`p-2 rounded-md transition-colors duration-150 ${
                    isCopiedIndo
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  } focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75`}
                  aria-label={isCopiedIndo ? "Prompt Bahasa Indonesia disalin" : "Salin Prompt Bahasa Indonesia"}
                >
                  {isCopiedIndo ? <CheckCircleIcon className="w-5 h-5" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
                </button>
              )}
            </div>
            <TextAreaInput
              id="generatedIndonesianPrompt"
              label=""
              value={generatedIndonesianPrompt}
              onChange={handleIndonesianPromptChange}
              placeholder="Hasil prompt Bahasa Indonesia akan muncul di sini..."
              rows={8}
              aria-label="Hasil Prompt Bahasa Indonesia (Dapat Diedit)"
            />
            {generatedIndonesianPrompt && (
                 <button
                    onClick={handleRetranslate}
                    disabled={isTranslating || !API_KEY}
                    className="w-full mt-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors duration-150 flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75"
                    aria-label="Terjemahkan ulang Prompt Bahasa Indonesia ke Bahasa Inggris"
                >
                    {isTranslating && API_KEY ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : <LanguageIcon className="w-4 h-4 mr-2" />}
                    Terjemahkan Ulang ke Inggris
                </button>
            )}
          </div>

          {/* English Prompt Output */}
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-sky-300">Final Prompt (English - Auto Translated)</h2>
              {generatedEnglishPrompt && !isTranslating && (
                <button
                  onClick={() => handleCopyToClipboard(generatedEnglishPrompt, 'eng')}
                  title="Copy English Prompt"
                  className={`p-2 rounded-md transition-colors duration-150 ${
                    isCopiedEng
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  } focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75`}
                  aria-label={isCopiedEng ? "Prompt Bahasa Inggris disalin" : "Salin Prompt Bahasa Inggris"}
                >
                  {isCopiedEng ? <CheckCircleIcon className="w-5 h-5" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
                </button>
              )}
            </div>
            {isTranslating && API_KEY && (
              <div className="min-h-[100px] flex flex-col items-center justify-center text-slate-400">
                <ArrowPathIcon className="w-8 h-8 animate-spin mb-2 text-sky-400" />
                Menerjemahkan ke Bahasa Inggris...
              </div>
            )}
            {!isTranslating && generatedEnglishPrompt && (
              <div className="bg-slate-700 p-3 rounded-lg shadow-inner min-h-[100px] max-h-[300px] overflow-y-auto">
                <p className="text-slate-200 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed" aria-live="polite">
                  {generatedEnglishPrompt}
                </p>
              </div>
            )}
            {!isTranslating && !generatedEnglishPrompt && !translationError &&(
                 <div className="bg-slate-700 p-3 rounded-lg shadow-inner min-h-[100px] flex items-center justify-center">
                    <p className="text-slate-400 italic">Prompt Bahasa Inggris akan muncul di sini setelah diterjemahkan...</p>
                 </div>
            )}
            {translationError && (
              <p className="text-sm text-red-400 mt-2" role="alert">{translationError}</p>
            )}
             {!API_KEY && !isTranslating && (
                <div className="bg-slate-700 p-3 rounded-lg shadow-inner min-h-[100px] flex items-center justify-center">
                    <p className="text-orange-400 italic text-center">Layanan terjemahan tidak tersedia. <br/> Pastikan API_KEY telah diatur.</p>
                 </div>
            )}
          </div>
        </section>
      </main>

      <footer className="w-full max-w-7xl mt-12 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Veo 3 Prompt Crafter. Dibuat untuk penggemar video AI.</p>
        <p className="text-xs mt-1">Disclaimer: "Veo 3" adalah nama ilustratif. Alat ini membantu membuat prompt untuk model video AI canggih secara umum.</p>
      </footer>
    </div>
  );
};

export default App;
