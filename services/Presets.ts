import { getPresets } from './API';

export async function loadData() {
  const presetsResponse = await getPresets();
  app.store.presets = presetsResponse.presets;
}
