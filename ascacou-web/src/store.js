import reduxDocuments from '@lpr/redux-documents';
import createReactStore from '@lpr/rtk/react';
import identity from './features/identity';

export default createReactStore({ slices: [reduxDocuments, identity] });
