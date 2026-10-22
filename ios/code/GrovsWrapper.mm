#import "GrovsWrapper.h"
// The wrapper's Swift header uses Grovs protocols, and Objective-C++ skips its @import Grovs.
#if __has_include(<Grovs/Grovs-Swift.h>)
#import <Grovs/Grovs-Swift.h>
#elif __has_include("Grovs-Swift.h")
#import "Grovs-Swift.h"
#endif
#if __has_include(<react_native_grovs_wrapper/react_native_grovs_wrapper-Swift.h>)
#import <react_native_grovs_wrapper/react_native_grovs_wrapper-Swift.h>
#elif __has_include("react_native_grovs_wrapper-Swift.h")
#import "react_native_grovs_wrapper-Swift.h"
#else
// Fall back if neither header is found
#warning "Swift bridging header not found"
#endif

static BOOL GrovsRejectIfDisabled(RCTPromiseRejectBlock reject) {
  if ([GrovsWrapperSwift isSDKEnabled]) {
    return NO;
  }
  reject(@"SDK_DISABLED", @"Grovs SDK is disabled. Call setSDK(true) first.", nil);
  return YES;
}

static NSDictionary *GrovsNormalizedRedirects(NSDictionary *customRedirects) {
  if (![customRedirects isKindOfClass:[NSDictionary class]]) {
    return nil;
  }
  NSMutableDictionary *(^extract)(NSDictionary *) = ^NSMutableDictionary *(NSDictionary *src) {
    NSMutableDictionary *out = [NSMutableDictionary dictionary];
    if ([src isKindOfClass:[NSDictionary class]]) {
      id link = src[@"link"];
      if ([link isKindOfClass:[NSString class]]) {
        out[@"link"] = link;
      }
      id flag = src[@"open_if_app_installed"];
      if ([flag respondsToSelector:@selector(boolValue)]) {
        out[@"open_if_app_installed"] = @([flag boolValue]);
      }
    }
    return out;
  };
  return @{
    @"android": extract(customRedirects[@"android"]),
    @"ios":     extract(customRedirects[@"ios"]),
    @"desktop": extract(customRedirects[@"desktop"]),
  };
}

static NSDictionary *GrovsNormalizedTracking(NSDictionary *tracking) {
  if (![tracking isKindOfClass:[NSDictionary class]]) {
    return nil;
  }
  NSMutableDictionary *out = [NSMutableDictionary dictionary];
  for (NSString *key in @[@"utm_campaign", @"utm_source", @"utm_medium"]) {
    id value = tracking[key];
    if ([value isKindOfClass:[NSString class]]) {
      out[key] = value;
    }
  }
  return out;
}

#ifdef RCT_NEW_ARCH_ENABLED

@implementation GrovsWrapper
RCT_EXPORT_MODULE()

+ (void)initialize {
  dispatch_async(dispatch_get_main_queue(), ^{
    GrovsWrapperSwift *wrapper = GrovsWrapperSwift.shared;
  });
}

- (instancetype)init {
  self = [super init];
  if (self) {
    GrovsWrapperSwift.shared.didReceiveDeeplink = ^(NSDictionary<NSString *,id> * _Nonnull payload) {
      //[self emitOnDeeplinkReceived:payload];
      [self sendEventWithName:@"onGrovsDeeplinkReceived" body:payload];
    };
    __weak GrovsWrapper *weakSelf = self;
    [GrovsWrapperSwift.shared attachInAppEventsWithOwner:self handler:^(NSDictionary<NSString *,id> * _Nonnull event) {
      [weakSelf sendEventWithName:@"onGrovsInAppMessage" body:event];
    }];
  }
  return self;
}

- (void)invalidate {
  [GrovsWrapperSwift.shared detachInAppEventsWithOwner:self];
  [super invalidate];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onGrovsDeeplinkReceived", @"onGrovsInAppMessage"];
}

- (void)addListener:(NSString *)eventName {
  [super addListener:eventName];
  
}

- (void)markReadyToHandleDeeplinks {
  dispatch_async(dispatch_get_main_queue(), ^{
    GrovsWrapperSwift.shared.bridgeLoaded = YES;
  });
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

- (void)track:(NSString *)name properties:(NSDictionary *)properties tags:(NSArray *)tags {
  [GrovsWrapperSwift.shared track:name properties:properties tags:tags];
}

- (void)trackScreenView:(NSString *)screenName properties:(NSDictionary *)properties {
  [GrovsWrapperSwift.shared trackScreenView:screenName properties:properties];
}

- (void)setGlobalTags:(NSArray *)tags {
  [GrovsWrapperSwift.shared setGlobalTags:tags];
}

- (void)setScreenAliases:(NSDictionary *)aliases {
  [GrovsWrapperSwift.shared setScreenAliases:aliases];
}

- (void)generateLink:(NSString *)title
            subtitle:(NSString *)subtitle
            imageURL:(NSString *)imageURL
                data:(NSDictionary *)data
                tags:(NSArray *)tags
     customRedirects:(NSDictionary *)customRedirects
         showPreviewIos:(NSNumber *)showPreviewIos
      showPreviewAndroid:(NSNumber *)showPreviewAndroid
            tracking:(NSDictionary *)tracking
  copyToClipboardIos:(NSNumber *)copyToClipboardIos
copyToClipboardAndroid:(NSNumber *)copyToClipboardAndroid
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  if (GrovsRejectIfDisabled(reject)) {
    return;
  }
  
  NSDictionary *redirects = GrovsNormalizedRedirects(customRedirects);
  NSDictionary *nativeTracking = GrovsNormalizedTracking(tracking);

  [GrovsWrapperSwift.shared generateLinkWithTitle:title
                                         subtitle:subtitle
                                         imageURL:imageURL
                                             data:data
                                             tags:tags
                                  customRedirects:redirects
                                      showPreviewIos:showPreviewIos
                               showPreviewAndroid:showPreviewAndroid
                                         tracking:nativeTracking
                               copyToClipboardIos:copyToClipboardIos
                           copyToClipboardAndroid:copyToClipboardAndroid
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
  if (GrovsRejectIfDisabled(reject)) {
    return;
  }
  [GrovsWrapperSwift.shared displayMessagesViewControllerWithCompletion:^{
    resolve(nil);
  }];
}

- (void)numberOfUnreadMessages:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject {
  if (GrovsRejectIfDisabled(reject)) {
    return;
  }
  [GrovsWrapperSwift.shared numberOfUnreadMessagesWithCompletion:^(NSInteger value) {
    if (value < 0) {
      reject(@"200", @"Failed to get number of messages", nil);
    } else {
      resolve(@(value));
    }
  }];
}

- (void)linkDetails:(NSString *)path
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  if (GrovsRejectIfDisabled(reject)) {
    return;
  }
  [GrovsWrapperSwift.shared linkDetailsWithPath:path completion:^(NSDictionary<NSString *, id> * _Nullable details) {
    if (details != nil) {
      resolve(details);
    } else {
      reject(@"Error", @"Failed to get link details.", nil);
    }
  }];
}

- (void)logInAppPurchase:(NSString *)transactionId
            originalJson:(NSString *)originalJson
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject {
  // originalJson is Android-only; iOS logs by StoreKit transaction id.
  [GrovsWrapperSwift.shared logInAppPurchase:transactionId completion:^(BOOL success) {
    resolve(@(success));
  }];
}

- (void)logCustomPurchase:(NSString *)type
             priceInCents:(double)priceInCents
                 currency:(NSString *)currency
                productId:(NSString *)productId
                startDate:(NSString *)startDate
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
  [GrovsWrapperSwift.shared logCustomPurchaseWithType:type
                                         priceInCents:(NSInteger)priceInCents
                                             currency:currency
                                            productId:productId
                                            startDate:startDate
                                           completion:^(BOOL success) {
    resolve(@(success));
  }];
}

- (void)markReadyForInAppEvents {
  [GrovsWrapperSwift.shared markReadyForInAppEvents];
}

- (void)pauseInAppMessages {
  [GrovsWrapperSwift.shared pauseInAppMessages];
}

- (void)resumeInAppMessages {
  [GrovsWrapperSwift.shared resumeInAppMessages];
}

- (void)discardInAppMessages:(BOOL)dismissCurrent {
  [GrovsWrapperSwift.shared discardInAppMessagesWithDismissCurrent:dismissCurrent];
}

- (void)setInAppExcludedScreens:(NSArray *)screens {
  [GrovsWrapperSwift.shared setInAppExcludedScreens:screens];
}

- (void)setInAppDebugLogging:(BOOL)enabled {
  [GrovsWrapperSwift.shared setInAppDebugLogging:enabled];
}

- (void)handleNotificationOpen:(NSDictionary *)data
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject {
  [GrovsWrapperSwift.shared handleNotificationOpen:data completion:^(BOOL handled) {
    resolve(@(handled));
  }];
}

- (void)isGrovsNotification:(NSDictionary *)data
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  resolve(@([GrovsWrapperSwift.shared isGrovsNotification:data]));
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

+ (void)initialize {
  dispatch_async(dispatch_get_main_queue(), ^{
    GrovsWrapperSwift *wrapper = GrovsWrapperSwift.shared;
  });
}

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
    __weak GrovsWrapper *weakSelf = self;
    [GrovsWrapperSwift.shared attachInAppEventsWithOwner:self handler:^(NSDictionary<NSString *,id> * _Nonnull event) {
      [weakSelf sendEventWithName:@"onGrovsInAppMessage" body:event];
    }];
  }
  return self;
}

- (void)invalidate {
  [GrovsWrapperSwift.shared detachInAppEventsWithOwner:self];
  [super invalidate];
}

// Support for event emission
- (NSArray<NSString *> *)supportedEvents {
  return @[@"onGrovsDeeplinkReceived", @"onGrovsInAppMessage"];
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

RCT_EXPORT_METHOD(track:(NSString *)name
                  properties:(NSDictionary *)properties
                  tags:(NSArray *)tags) {
  [GrovsWrapperSwift.shared track:name properties:properties tags:tags];
}

RCT_EXPORT_METHOD(trackScreenView:(NSString *)screenName
                  properties:(NSDictionary *)properties) {
  [GrovsWrapperSwift.shared trackScreenView:screenName properties:properties];
}

RCT_EXPORT_METHOD(setGlobalTags:(NSArray *)tags) {
  [GrovsWrapperSwift.shared setGlobalTags:tags];
}

RCT_EXPORT_METHOD(setScreenAliases:(NSDictionary *)aliases) {
  [GrovsWrapperSwift.shared setScreenAliases:aliases];
}

RCT_EXPORT_METHOD(displayMessages:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (GrovsRejectIfDisabled(reject)) {
    return;
  }
  [GrovsWrapperSwift.shared displayMessagesViewControllerWithCompletion:^{
    resolve(nil);
  }];
}

RCT_EXPORT_METHOD(numberOfUnreadMessages:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (GrovsRejectIfDisabled(reject)) {
    return;
  }
  [GrovsWrapperSwift.shared numberOfUnreadMessagesWithCompletion:^(NSInteger value) {
    if (value < 0) {
      reject(@"200", @"Failed to get number of messages", nil);
    } else {
      resolve(@(value));
    }
  }];
}

RCT_EXPORT_METHOD(linkDetails:(NSString *)path
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (GrovsRejectIfDisabled(reject)) {
    return;
  }
  [GrovsWrapperSwift.shared linkDetailsWithPath:path completion:^(NSDictionary<NSString *, id> * _Nullable details) {
    if (details != nil) {
      resolve(details);
    } else {
      reject(@"Error", @"Failed to get link details.", nil);
    }
  }];
}

RCT_EXPORT_METHOD(generateLink:(NSString *)title
                  subtitle:(NSString *)subtitle
                  imageURL:(NSString *)imageURL
                  data:(NSDictionary *)data
                  tags:(NSArray *)tags
                  customRedirects:(NSDictionary *)customRedirects
                  showPreviewIos:(NSNumber *)showPreviewIos
                  showPreviewAndroid:(NSNumber *)showPreviewAndroid
                  tracking:(NSDictionary *)tracking
                  copyToClipboardIos:(NSNumber *)copyToClipboardIos
                  copyToClipboardAndroid:(NSNumber *)copyToClipboardAndroid
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (GrovsRejectIfDisabled(reject)) {
    return;
  }
  [GrovsWrapperSwift.shared generateLinkWithTitle:title
                                         subtitle:subtitle
                                         imageURL:imageURL
                                             data:data
                                             tags:tags
                                  customRedirects:GrovsNormalizedRedirects(customRedirects)
                                   showPreviewIos:showPreviewIos
                               showPreviewAndroid:showPreviewAndroid
                                         tracking:GrovsNormalizedTracking(tracking)
                               copyToClipboardIos:copyToClipboardIos
                           copyToClipboardAndroid:copyToClipboardAndroid
                                       completion:^(NSURL * _Nullable link) {
    if (link.absoluteString != nil) {
      resolve(link.absoluteString);
    } else {
      reject(@"100", @"Failed to generate the link!", nil);
    }
  }];
}

RCT_EXPORT_METHOD(logInAppPurchase:(NSString *)transactionId
                  originalJson:(NSString *)originalJson
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [GrovsWrapperSwift.shared logInAppPurchase:transactionId completion:^(BOOL success) {
    resolve(@(success));
  }];
}

RCT_EXPORT_METHOD(logCustomPurchase:(NSString *)type
                  priceInCents:(double)priceInCents
                  currency:(NSString *)currency
                  productId:(NSString *)productId
                  startDate:(NSString *)startDate
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [GrovsWrapperSwift.shared logCustomPurchaseWithType:type
                                         priceInCents:(NSInteger)priceInCents
                                             currency:currency
                                            productId:productId
                                            startDate:startDate
                                           completion:^(BOOL success) {
    resolve(@(success));
  }];
}

RCT_EXPORT_METHOD(markReadyForInAppEvents) {
  [GrovsWrapperSwift.shared markReadyForInAppEvents];
}

RCT_EXPORT_METHOD(pauseInAppMessages) {
  [GrovsWrapperSwift.shared pauseInAppMessages];
}

RCT_EXPORT_METHOD(resumeInAppMessages) {
  [GrovsWrapperSwift.shared resumeInAppMessages];
}

RCT_EXPORT_METHOD(discardInAppMessages:(BOOL)dismissCurrent) {
  [GrovsWrapperSwift.shared discardInAppMessagesWithDismissCurrent:dismissCurrent];
}

RCT_EXPORT_METHOD(setInAppExcludedScreens:(NSArray *)screens) {
  [GrovsWrapperSwift.shared setInAppExcludedScreens:screens];
}

RCT_EXPORT_METHOD(setInAppDebugLogging:(BOOL)enabled) {
  [GrovsWrapperSwift.shared setInAppDebugLogging:enabled];
}

RCT_EXPORT_METHOD(handleNotificationOpen:(NSDictionary *)data
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  [GrovsWrapperSwift.shared handleNotificationOpen:data completion:^(BOOL handled) {
    resolve(@(handled));
  }];
}

RCT_EXPORT_METHOD(isGrovsNotification:(NSDictionary *)data
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  resolve(@([GrovsWrapperSwift.shared isGrovsNotification:data]));
}

RCT_EXPORT_METHOD(markReadyToHandleDeeplinks) {
  dispatch_async(dispatch_get_main_queue(), ^{
    GrovsWrapperSwift.shared.bridgeLoaded = YES;
  });
}


@end

#endif
