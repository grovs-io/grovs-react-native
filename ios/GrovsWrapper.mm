#import "GrovsWrapper.h"
#import "react_native_grovs_wrapper-Swift.h"

@implementation GrovsWrapper
RCT_EXPORT_MODULE()

- (instancetype)init {
  self = [super init];
  if (self) {
    GrovsWrapperSwift.shared.didReceiveDeeplink = ^(NSDictionary<NSString *,id> * _Nonnull payload) {
      [self emitOnDeeplinkReceived:payload];
    };
  }
  return self;
}

- (void)setIdentifier:(NSString *)identifier {
  [GrovsWrapperSwift.shared setIdentifier:identifier];
}

- (void)setPushToken:(NSString *)pushToken {
  [GrovsWrapperSwift.shared setPushToken:pushToken];
}

- (void)setAttributes:(NSDictionary *)attributes {
  [GrovsWrapperSwift.shared setAttributes:attributes];
}

- (void)setSDK:(BOOL)enabled {
  [GrovsWrapperSwift.shared setSDK:enabled];
}

- (void)setDebug:(NSString *)level {
  [GrovsWrapperSwift.shared setDebug:level];
}

- (void)generateLink:(NSString *)title
            subtitle:(NSString *)subtitle
            imageURL:(NSString *)imageURL
                data:(NSDictionary *)data
                tags:(NSArray *)tags
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  
  [GrovsWrapperSwift.shared generateLinkWithTitle:title
                                         subtitle:subtitle
                                         imageURL:imageURL
                                             data:data
                                             tags:tags
                                       completion:^(NSURL * _Nullable link) {
    if (link.absoluteString != nil) {
      resolve(link.absoluteString);
    } else {
      reject(@"100", @"Failed to generate the link!", nil);
    }
  }];
}

- (void)displayMessages:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
  [GrovsWrapperSwift.shared displayMessagesViewControllerWithCompletion:^{
    resolve(nil);
  }];
}

- (void)numberOfUnreadMessages:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject {
  [GrovsWrapperSwift.shared numberOfUnreadMessagesWithCompletion:^(NSInteger value) {
    if (value < 0) {
      reject(@"200", @"Failed to get number of messages", nil);
    } else {
      resolve(@(value));
    }
  }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeGrovsWrapperSpecJSI>(params);
}

@end
