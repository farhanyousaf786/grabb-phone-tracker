require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'HabitTrackerModule'
  s.version        = package['version']
  s.summary        = package['description']
  s.license        = { :type => 'MIT' }
  s.homepage       = 'https://github.com/ibneyousaf/habit-tracker'
  s.authors        = 'ibneyousaf'
  s.source         = { :path => '.' }
  s.source_files   = 'ios/**/*.{swift,h,m,mm}'
  s.ios.deployment_target = '15.1'
  s.swift_version  = '5.4'

  s.dependency 'ExpoModulesCore'

  # Required for Expo auto-linking to include this in ExpoModulesProvider
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
