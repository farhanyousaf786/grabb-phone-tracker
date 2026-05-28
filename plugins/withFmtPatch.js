const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFmtPatch(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfile)) {
        let content = fs.readFileSync(podfile, 'utf-8');
        
        // Check if our patch is already in the Podfile
        if (!content.includes('CLANG_CXX_LANGUAGE_STANDARD')) {
          console.log('[withFmtPatch] Injecting C++17 language override for {fmt} target inside Podfile to bypass Xcode 16 consteval crash...');
          
          const patchBlock = `
    # Fix for Xcode 16 fmt consteval error
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
`;
          
          // Locate the post_install hook and insert our patch block right after
          if (content.includes('post_install do |installer|')) {
            content = content.replace(
              'post_install do |installer|',
              'post_install do |installer|' + patchBlock
            );
          }
          
          fs.writeFileSync(podfile, content, 'utf-8');
        }
      }
      return config;
    },
  ]);
};
