import reduxDocuments from '@lpr/redux-documents';
import createReactStore from '@lpr/rtk/react';
import identity from './features/identity';
import sync from './features/sync';
import presence from './features/presence';

export default createReactStore({ slices: [reduxDocuments, identity, sync, presence] });
