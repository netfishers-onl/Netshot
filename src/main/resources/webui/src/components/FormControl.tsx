import { Tooltip } from "@/components/ui/tooltip"
import {
  Field,
  IconButton,
  Input,
  InputGroup,
  type InputProps,
  SystemStyleObject,
  Textarea,
} from "@chakra-ui/react"
import { forwardRef, ReactElement, ReactNode, RefObject, useCallback, useEffect, useRef, useState } from "react"
import { useController, UseControllerProps } from "react-hook-form"
import { useTranslation } from "react-i18next"

import Icon from "./Icon"

export const PASSWORD_UNCHANGED = null

export enum FormControlType {
  Text = "text",
  Password = "password",
  LongText = "longtext",
  File = "file",
  Number = "number",
  Date = "date",
  DateTime = "datetime",
  Time = "time",
  Url = "url",
}

export type FormControlProps<T> = {
  label?: string
  type?: FormControlType
  helperText?: string
  uppercase?: boolean
  rows?: number
  onFocus?(): void
  suffix?: ReactNode
  prefix?: ReactNode
  allowUnchanged?: boolean
} & Omit<InputProps, "recipe"> &
  Omit<SystemStyleObject, "recipe"> &
  UseControllerProps<T>

declare module "react" {
  function forwardRef<T, P = object>(
    render: (props: P, ref: React.Ref<T>) => React.ReactNode | null
  ): (props: P & React.RefAttributes<T>) => React.ReactNode | null
}

function FormControl<T>(
  props: FormControlProps<T>,
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement>
) {
  const {
    label,
    placeholder,
    control,
    name,
    defaultValue,
    rules = {},
    required,
    disabled,
    type = FormControlType.Text,
    helperText,
    uppercase = false,
    rows = 10,
    onFocus,
    autoFocus,
    suffix,
    prefix,
    autoComplete,
    variant,
    allowUnchanged = false,
    ...other
  } = props

  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [isUnchanged, setIsUnchanged] = useState(allowUnchanged)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
    rules: {
      required,
      ...rules,
    },
    defaultValue,
  })

  useEffect(() => {
    if (!allowUnchanged) return
    if (isUnchanged && field.value != PASSWORD_UNCHANGED) {
      setIsUnchanged(false)
      setShowPassword(false)
    } else if (!isUnchanged && field.value == PASSWORD_UNCHANGED) {
      setIsUnchanged(true)
      setShowPassword(false)
    }
  }, [field.value])

  useEffect(() => {
    if (!isUnchanged && allowUnchanged) {
      passwordInputRef.current?.focus()
    }
  }, [isUnchanged])

  const inputProps = {
    onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
      field.onChange(uppercase ? e.target.value.toUpperCase() : e)
    },
    onBlur() {
      field.onBlur()
    },
    onFocus() {
      if (onFocus) onFocus()
    },
    placeholder,
    name,
    ref(inputRef) {
      field.ref(inputRef)

      if (ref) {
        ref.current = inputRef
      }
    },
    autoFocus,
    variant,
  }

  const togglePassword = useCallback(() => {
    if (isUnchanged) {
      setIsUnchanged(false)
      field.onChange("")
    } else {
      setShowPassword((prev) => !prev)
    }
  }, [isUnchanged, field])

  const lockPassword = useCallback(() => {
    setIsUnchanged(true)
    setShowPassword(false)
    field.onChange(PASSWORD_UNCHANGED)
  }, [field])

  return (
    <Field.Root required={required} disabled={disabled} {...other}>
      {label && (
        <Field.Label>
          {label}
          <Field.RequiredIndicator />
        </Field.Label>
      )}
      {[
        FormControlType.Text,
        FormControlType.Number,
        FormControlType.Date,
        FormControlType.DateTime,
        FormControlType.Time,
        FormControlType.Url,
      ].includes(type) && (
        <InputGroup startElement={prefix} endElement={suffix}>
          <Input
            type={type}
            value={String(field.value as string)}
            autoComplete={autoComplete}
            {...inputProps}
          />
        </InputGroup>
      )}
      {type === FormControlType.Password && (
        <InputGroup
          startAddon={prefix}
          endElement={
            <>
              {allowUnchanged && !isUnchanged && (
                <Tooltip content={t("passwordUnchanged")} positioning={{ placement: "top" }}>
                  <span>
                    <IconButton
                      variant="ghost"
                      bg="transparent!important"
                      aria-label={t("passwordUnchanged")}
                      onClick={lockPassword}
                    >
                      <Icon name="unlock" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Tooltip
                content={isUnchanged ? t("passwordUnchanged") : showPassword ? t("hidePassword") : t("showPassword")}
                positioning={{ placement: "top" }}
              >
                <span>
                  <IconButton
                    variant="ghost"
                    bg="transparent!important"
                    aria-label={isUnchanged ? t("passwordUnchanged") : showPassword ? t("hidePassword") : t("showPassword")}
                    onClick={togglePassword}
                  >
                    {isUnchanged ? <Icon name="lock" /> : showPassword ? <Icon name="eye" /> : <Icon name="eyeOff" />}
                  </IconButton>
                </span>
              </Tooltip>
            </>
          }
        >
          <Input
            type={showPassword ? "text" : "password"}
            value={isUnchanged ? "••••••••" : String(field.value as string)}
            disabled={isUnchanged}
            {...inputProps}
            ref={(inputRef) => {
              inputProps.ref(inputRef)
              passwordInputRef.current = inputRef
            }}
          />
        </InputGroup>
      )}
      {type === FormControlType.LongText && (
        <Textarea rows={rows} value={field.value == null ? "" : String(field.value as string)} {...inputProps} />
      )}
      {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
      {error && <Field.HelperText color="red.500">{error?.message}</Field.HelperText>}
    </Field.Root>
  )
}

export default forwardRef(FormControl)
