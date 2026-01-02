interface MeditationSessionData {
  uri: string;
  cid: string;
  createdAt: string;
  duration: number;
  presetId: string | null;
  notes: string | null;
}

interface SoundInterval {
  time: number;
  soundType: string;
}

interface PresetData {
  uri: string;
  cid: string;
  name: string;
  duration: number;
  createdAt: string;
  soundIntervals: SoundInterval[];
}

interface StoreType {
  meditationSessions: MeditationSessionData[];
  presets: PresetData[];
}

const Store: StoreType = {
  meditationSessions: [],
  presets: [],
};

export default Store;
