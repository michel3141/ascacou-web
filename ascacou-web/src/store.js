import reduxDocuments from '@lpr/redux-documents';
import createReactStore from '@lpr/rtk/react';
import identity from './features/identity';
import sync from './features/sync';

export default createReactStore({ slices: [reduxDocuments, identity, sync] });
