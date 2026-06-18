#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
#if TARGET_OS_SIMULATOR
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  NSString *ipPath = [[NSBundle mainBundle] pathForResource:@"ip" ofType:@"txt"];
  NSString *ip = ipPath
    ? [[NSString stringWithContentsOfFile:ipPath encoding:NSUTF8StringEncoding error:nil]
        stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]]
    : nil;

  if (ip.length == 0) {
    ip = [[NSProcessInfo processInfo] environment][@"REACT_NATIVE_PACKAGER_HOSTNAME"] ?: @"localhost";
  }

  NSString *portPath = [[NSBundle mainBundle] pathForResource:@"metro" ofType:@"port"];
  NSString *port = portPath
    ? [[NSString stringWithContentsOfFile:portPath encoding:NSUTF8StringEncoding error:nil]
        stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]]
    : @"8081";

  // Prefer localhost so USB tunneling with iproxy works first.
  NSArray<NSString *> *hostPorts = @[
    [NSString stringWithFormat:@"localhost:%@", port],
    [NSString stringWithFormat:@"%@:%@", ip, port],
  ];

  for (NSString *hostPort in hostPorts) {
    if ([RCTBundleURLProvider isPackagerRunning:hostPort scheme:@"http"]) {
      return [RCTBundleURLProvider jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"
                                               packagerHost:hostPort
                                             packagerScheme:@"http"
                                                  enableDev:YES
                                         enableMinification:NO
                                            inlineSourceMap:NO
                                                modulesOnly:NO
                                                  runModule:YES];
    }
  }

  return [RCTBundleURLProvider jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"
                                           packagerHost:hostPorts[0]
                                         packagerScheme:@"http"
                                              enableDev:YES
                                     enableMinification:NO
                                        inlineSourceMap:NO
                                            modulesOnly:NO
                                              runModule:YES];
#endif
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end
