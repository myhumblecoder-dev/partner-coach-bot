'use client'

import { useEffect } from 'react'
import { saveTimezone } from '@/app/actions/saveTimezone'

interface TimezoneCaptureProps {
  profileId: string
  savedTimezone: string | null
}

export default function TimezoneCapture({ profileId, savedTimezone }: TimezoneCaptureProps) {
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (savedTimezone === null || detectedTimezone !== savedTimezone) {
      const performSave = async () => {
        try {
          await saveTimezone(profileId, detectedTimezone)
        } catch (err) {
          if (err instanceof Error) {
            console.error(err.message)
          }
        }
      }
      performSave()
    }
  }, [profileId, savedTimezone])

  return (
    <p data-testid="tz-display">
      {savedTimezone === null
        ? 'Detecting timezone…'
        : `Timezone: ${savedTimezone}`}
    </p>
  )
}
