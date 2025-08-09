#ifdef RCT_NEW_ARCH_ENABLED
#import "../generated/RNGrovsWrapperSpec/RNGrovsWrapperSpec.h"
#import <React/RCTEventEmitter.h>

@interface GrovsWrapper : RCTEventEmitter <NativeGrovsWrapperSpec>

@end

#else

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface GrovsWrapper : RCTEventEmitter <RCTBridgeModule>

@end

#endif
