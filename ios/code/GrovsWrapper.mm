#import "GrovsWrapper.h"
#import "react_native_grovs_wrapper-Swift.h"

#ifdef RCT_NEW_ARCH_ENABLED

@implementation GrovsWrapper
RCT_EXPORT_MODULE()

- (instancetype)init {
  //self = [super init];
  if (self) {
    GrovsWrapperSwift.shared.didReceiveDeeplink = ^(NSDictionary<NSString *,id> * _Nonnull payload) {
      //[self emitOnDeeplinkReceived:payload];
      [self sendEventWithName:@"onGrovsDeeplinkReceived" body:payload];
    };
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onGrovsDeeplinkReceived"];
}

- (void)addListener:(NSString *)eventName {
  [super addListener:eventName];
}

- (void)removeListeners:(double)count {
  [super removeListeners:count];
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
     customRedirects:(JS::NativeGrovsWrapper::CustomRedirects &)customRedirects
         showPreviewIos:(NSNumber *)showPreviewIos
      showPreviewAndroid:(NSNumber *)showPreviewAndroid
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  
  NSDictionary * redirects = @{@"android": @{@"link": customRedirects.android().link(),
                                             @"open_if_app_installed": @(customRedirects.android().open_if_app_installed())},
                               @"ios": @{@"link": customRedirects.ios().link(),
                                                                          @"open_if_app_installed": @(customRedirects.ios().open_if_app_installed())},
                               @"desktop": @{@"link": customRedirects.desktop().link(),
                                             @"open_if_app_installed": @(customRedirects.desktop().open_if_app_installed())},
  };
  [GrovsWrapperSwift.shared generateLinkWithTitle:title
                                         subtitle:subtitle
                                         imageURL:imageURL
                                             data:data
                                             tags:tags
                                  customRedirects:redirects
                                      showPreviewIos:showPreviewIos
                               showPreviewAndroid:showPreviewAndroid
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

#else

@implementation GrovsWrapper {
  bool hasListeners;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    GrovsWrapperSwift.shared.didReceiveDeeplink = ^(NSDictionary<NSString *,id> * _Nonnull payload) {
      [self sendEventWithName:@"onGrovsDeeplinkReceived" body:payload];
    };
  }
  return self;
}

// Support for event emission
- (NSArray<NSString *> *)supportedEvents {
  return @[@"onGrovsDeeplinkReceived"];
}

- (void)startObserving {
  hasListeners = YES;
}

- (void)stopObserving {
  hasListeners = NO;
}

RCT_EXPORT_METHOD(setIdentifier:(NSString *)identifier) {
  [GrovsWrapperSwift.shared setIdentifier:identifier];
}

RCT_EXPORT_METHOD(setPushToken:(NSString *)pushToken) {
  [GrovsWrapperSwift.shared setPushToken:pushToken];
}

RCT_EXPORT_METHOD(setAttributes:(NSDictionary *)attributes) {
  [GrovsWrapperSwift.shared setAttributes:attributes];
}

RCT_EXPORT_METHOD(setSDK:(BOOL)enabled) {
  [GrovsWrapperSwift.shared setSDK:enabled];
}

RCT_EXPORT_METHOD(setDebug:(NSString *)level) {
  [GrovsWrapperSwift.shared setDebug:level];
}

RCT_EXPORT_METHOD(displayMessages:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [GrovsWrapperSwift.shared displayMessagesViewControllerWithCompletion:^{
    resolve(nil);
  }];
}

RCT_EXPORT_METHOD(numberOfUnreadMessages:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [GrovsWrapperSwift.shared numberOfUnreadMessagesWithCompletion:^(NSInteger value) {
    if (value < 0) {
      reject(@"200", @"Failed to get number of messages", nil);
    } else {
      resolve(@(value));
    }
  }];
}

RCT_EXPORT_METHOD(generateLink:(NSString *)title
                        subtitle:(NSString *)subtitle
                        imageURL:(NSString *)imageURL
                            data:(NSDictionary *)data
                            tags:(NSArray *)tags
                 customRedirects:(NSDictionary *)customRedirects
                     showPreviewIos:(nonnull NSNumber *)showPreviewIos
                showPreviewAndroid:(nonnull NSNumber *)showPreviewAndroid
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject) {
//  NSDictionary * redirects = @{@"android": @{@"link": customRedirects.android().link(),
//                                             @"open_if_app_installed": @(customRedirects.android().open_if_app_installed())},
//                               @"ios": @{@"link": customRedirects.ios().link(),
//                                         @"open_if_app_installed": @(customRedirects.ios().open_if_app_installed())},
//                               @"desktop": @{@"link": customRedirects.desktop().link(),
//                                             @"open_if_app_installed": @(customRedirects.desktop().open_if_app_installed())},
//  };
  [GrovsWrapperSwift.shared generateLinkWithTitle:title
                                         subtitle:subtitle
                                         imageURL:imageURL
                                             data:data
                                             tags:tags
                                  customRedirects:customRedirects
                                      showPreviewIos:showPreviewIos
                               showPreviewAndroid:showPreviewAndroid
                                       completion:^(NSURL * _Nullable link) {
    if (link.absoluteString != nil) {
      resolve(link.absoluteString);
    } else {
      reject(@"100", @"Failed to generate the link!", nil);
    }
  }];
}

@end

#endif
