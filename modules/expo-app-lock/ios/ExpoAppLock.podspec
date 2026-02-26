Pod::Spec.new do |s|
  s.name           = 'ExpoAppLock'
  s.version        = '1.0.0'
  s.summary        = 'Biometric and passcode app lock using LocalAuthentication'
  s.description    = 'Biometric and passcode app lock using LocalAuthentication'
  s.author         = ''
  s.homepage       = 'https://github.com/sheersky'
  s.platforms      = { :ios => '13.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
