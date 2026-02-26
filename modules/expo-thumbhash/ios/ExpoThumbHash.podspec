Pod::Spec.new do |s|
  s.name           = 'ExpoThumbHash'
  s.version        = '1.0.0'
  s.summary        = 'Native ThumbHash image placeholder decoding'
  s.description    = 'Native ThumbHash image placeholder decoding with View component'
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
