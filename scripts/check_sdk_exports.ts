import * as IWSDKCore from '@iwsdk/core';

console.log('Types:', IWSDKCore.Types);
console.log('TypedArrayMap:', (IWSDKCore as any).TypedArrayMap);

if (IWSDKCore.Types) {
    console.log('Types.Float32:', IWSDKCore.Types.Float32);
    console.log('Types.Boolean:', IWSDKCore.Types.Boolean);
}
