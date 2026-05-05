import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag } from '../../../../../../app/src/Features/Tags/types'
import useAsync from '../../../../shared/hooks/use-async'
import { useProjectListContext } from '../../context/project-list-context'
import { useRefWithAutoFocus } from '../../../../shared/hooks/use-ref-with-auto-focus'
import { createFolder } from '../../util/api'
import { MAX_TAG_LENGTH } from '../../util/tag'
import { debugConsole } from '@/utils/debugging'
import {
  OLModal,
  OLModalBody,
  OLModalFooter,
  OLModalHeader,
  OLModalTitle,
} from '@/shared/components/ol/ol-modal'
import OLFormGroup from '@/shared/components/ol/ol-form-group'
import OLFormLabel from '@/shared/components/ol/ol-form-label'
import OLButton from '@/shared/components/ol/ol-button'
import OLFormControl from '@/shared/components/ol/ol-form-control'
import OLForm from '@/shared/components/ol/ol-form'
import Notification from '@/shared/components/notification'

type CreateTagModalProps = {
  id: string
  show: boolean
  onCreate: (tag: Tag) => void
  onClose: () => void
}

export default function CreateTagModal({
  id,
  show,
  onCreate,
  onClose,
}: CreateTagModalProps) {
  const { tags } = useProjectListContext()
  const { t } = useTranslation()
  const { isLoading, isError, runAsync, status } = useAsync<Tag>()
  const { autoFocusedRef } = useRefWithAutoFocus<HTMLInputElement>()

  const [tagName, setTagName] = useState<string>()
  const [validationError, setValidationError] = useState<string>()

  const runCreateTag = useCallback(() => {
    if (tagName) {
      runAsync(createFolder(tagName))
        .then(tag => onCreate(tag))
        .catch(debugConsole.error)
    }
  }, [runAsync, tagName, onCreate])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      runCreateTag()
    },
    [runCreateTag]
  )

  useEffect(() => {
    if (tagName && tagName.length > MAX_TAG_LENGTH) {
      setValidationError(
        t('tag_name_cannot_exceed_characters', { maxLength: MAX_TAG_LENGTH })
      )
    } else if (tagName && tags.find(tag => tag.name === tagName)) {
      setValidationError(t('tag_name_is_already_used', { tagName }))
    } else if (validationError) {
      setValidationError(undefined)
    }
  }, [tagName, tags, t, validationError])

  if (!show) {
    return null
  }

  return (
    <OLModal show animation onHide={onClose} id={id} backdrop="static">
      <OLModalHeader>
        <OLModalTitle>{t('create_new_tag')}</OLModalTitle>
      </OLModalHeader>

      <OLModalBody>
        <OLForm onSubmit={handleSubmit}>
          <OLFormGroup controlId="create-tag-modal-form">
            <OLFormLabel>{t('new_tag_name')}</OLFormLabel>
            <OLFormControl
              name="new-tag-form-name"
              onChange={e => setTagName(e.target.value)}
              ref={autoFocusedRef}
              required
              type="text"
            />
          </OLFormGroup>
        </OLForm>
        {validationError && (
          <Notification type="error" content={validationError} />
        )}
        {isError && (
          <Notification
            type="error"
            content={t('generic_something_went_wrong')}
          />
        )}
      </OLModalBody>

      <OLModalFooter>
        <OLButton
          variant="secondary"
          onClick={onClose}
          disabled={status === 'pending'}
        >
          {t('cancel')}
        </OLButton>
        <OLButton
          onClick={() => runCreateTag()}
          variant="primary"
          disabled={
            status === 'pending' || !tagName?.length || !!validationError
          }
          isLoading={isLoading}
          loadingLabel={t('creating')}
        >
          {t('create')}
        </OLButton>
      </OLModalFooter>
    </OLModal>
  )
}
