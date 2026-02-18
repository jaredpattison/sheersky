import {useCallback} from 'react'

export enum SupportCode {
  AA_DID = 'AA_DID',
  AA_BIRTHDATE = 'AA_BIRTHDATE',
}

export function useCreateSupportLink() {
  return useCallback(
    ({code: _code, email: _email}: {code: SupportCode; email?: string}) => {
      return '/support'
    },
    [],
  )
}
