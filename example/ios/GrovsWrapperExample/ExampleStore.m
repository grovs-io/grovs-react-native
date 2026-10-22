#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ExampleStore, NSObject)

RCT_EXTERN_METHOD(getAll:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(set:(NSString *)key value:(nullable NSString *)value)
RCT_EXTERN_METHOD(restart)
RCT_EXTERN_METHOD(fetchPushToken:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
