import type React from 'react'

import {Provider as AltTextRequiredProvider} from './alt-text-required'
import {Provider as AppLockProvider} from './app-lock'
import {Provider as AutoplayProvider} from './autoplay'
import {Provider as DisableHapticsProvider} from './disable-haptics'
import {Provider as ExternalEmbedsProvider} from './external-embeds-prefs'
import {Provider as HiddenPostsProvider} from './hidden-posts'
import {Provider as HiddenRepostDidsProvider} from './hidden-reposts'
import {Provider as HideProfileRepostsProvider} from './hide-profile-reposts'
import {Provider as InAppBrowserProvider} from './in-app-browser'
import {Provider as KawaiiProvider} from './kawaii'
import {Provider as LanguagesProvider} from './languages'
import {Provider as LargeAltBadgeProvider} from './large-alt-badge'
import {Provider as SkeetTerminologyProvider} from './skeet-terminology'
import {Provider as SubtitlesProvider} from './subtitles'
import {Provider as TrendingSettingsProvider} from './trending'
import {Provider as UsedStarterPacksProvider} from './used-starter-packs'

export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'
export {useAppLock, useAppLockApi} from './app-lock'
export {useAutoplayDisabled, useSetAutoplayDisabled} from './autoplay'
export {useHapticsDisabled, useSetHapticsDisabled} from './disable-haptics'
export {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from './external-embeds-prefs'
export {useHiddenPosts, useHiddenPostsApi} from './hidden-posts'
export {useHiddenRepostDids, useHiddenRepostDidsApi} from './hidden-reposts'
export {
  useHideProfileReposts,
  useSetHideProfileReposts,
} from './hide-profile-reposts'
export {useLabelDefinitions} from './label-defs'
export {useLanguagePrefs, useLanguagePrefsApi} from './languages'
export {useSetSkeetTerminology, useSkeetTerminology} from './skeet-terminology'
export {useSetSubtitlesEnabled, useSubtitlesEnabled} from './subtitles'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <AppLockProvider>
      <LanguagesProvider>
        <AltTextRequiredProvider>
          <LargeAltBadgeProvider>
            <ExternalEmbedsProvider>
              <HiddenPostsProvider>
                <HiddenRepostDidsProvider>
                  <HideProfileRepostsProvider>
                    <InAppBrowserProvider>
                      <DisableHapticsProvider>
                        <AutoplayProvider>
                          <UsedStarterPacksProvider>
                            <SubtitlesProvider>
                              <TrendingSettingsProvider>
                                <KawaiiProvider>
                                  <SkeetTerminologyProvider>
                                    {children}
                                  </SkeetTerminologyProvider>
                                </KawaiiProvider>
                              </TrendingSettingsProvider>
                            </SubtitlesProvider>
                          </UsedStarterPacksProvider>
                        </AutoplayProvider>
                      </DisableHapticsProvider>
                    </InAppBrowserProvider>
                  </HideProfileRepostsProvider>
                </HiddenRepostDidsProvider>
              </HiddenPostsProvider>
            </ExternalEmbedsProvider>
          </LargeAltBadgeProvider>
        </AltTextRequiredProvider>
      </LanguagesProvider>
    </AppLockProvider>
  )
}
