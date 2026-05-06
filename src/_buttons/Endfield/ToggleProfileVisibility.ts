import { ButtonHandler } from '../../../types/index.js';
import { EndfieldSetVisibility } from '../../interactionHandler/Endfield/SetVisibility.js';

export default {
  status: true,
  id: 'endfield-toggle-profile-visibility',
  run: async function (int) {
    await int.SendOrEdit(true);
    return EndfieldSetVisibility(int);
  },
} as ButtonHandler;
