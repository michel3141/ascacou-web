import reduxDocuments from '@lpr/redux-documents';
import createReactStore from '@lpr/rtk/react';
import identity from './features/identity';
import sync from './features/sync';
import roomChannel from './features/roomChannel';
import notices from './features/notices';

export default createReactStore({ slices: [reduxDocuments, identity, sync, roomChannel, notices] });
