Pod::Spec.new do |s|
  s.name           = 'ExpoSecureCredentials'
  s.version        = '1.0.0'
  s.summary        = 'Secure token storage using iOS Keychain'
  s.description    = 'Secure token storage using iOS Keychain'
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
