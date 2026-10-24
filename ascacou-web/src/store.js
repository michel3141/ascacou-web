import reduxDocuments from '@lpr/redux-documents';
import createReactStore from '@lpr/rtk/react';
import identity from './features/identity';
import sync from './features/sync';
import roomChannel from './features/roomChannel';

export default createReactStore({ slices: [reduxDocuments, identity, sync, roomChannel] });
