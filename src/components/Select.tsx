import useAxios from '@/hooks/Axios'
import { useEffect, useState } from 'react'
import RSelect, { GroupBase, InputActionMeta, OptionsOrGroups, PropsValue, SingleValue } from 'react-select'
import AsyncSelect from 'react-select/async'
import styles from './Select.module.css'

type Props = {
  options?: OptionsOrGroups<{
    label: string;
    value: string;
  }, GroupBase<{
    label: string;
    value: string;
  }>> | undefined

  placeholder: string
  onChange: (value: SingleValue<{
    label?: string;
    value?: string;
  }> | SingleValue<{
    label?: string;
    value?: string;
  }>
  ) => void
  className?: string
  autoFocus?: boolean
  defaultValue?: PropsValue<{
    label?: string;
    value?: string;
  }> | undefined
  errorMessages?: string[]
  errorClassname?: string

  asynchronous?: boolean
  urlSource?: string
  dataValue?: {
    label: string;
    value: string;
  }
  containerClassName?: string
  required?: boolean
  isClearable?: boolean
  name?: string
  id?: string
  label?: string
  customAsync?: boolean
  onInputChange?: ((newValue: string, actionMeta?: InputActionMeta) => void)
  limit?: number
  disabled?: boolean
}

const CustomContainer = (props: Props) => {
  const container = 'self-end w-full' + (props.className ? ` ${props.className}` : '')
  const [filled, setFilled] = useState<boolean>(false)
  const [options, setOptions] = useState<OptionsOrGroups<{
    label?: string | undefined;
    value?: string | undefined;
  }, GroupBase<{
    label: string;
    value: string;
  }>> | undefined>([])
  // console.log(props.defaultValue)

  const TrueSelect = props.asynchronous ? AsyncSelect : RSelect

  useEffect(() => {
    if (props.defaultValue
      && 'label' in props.defaultValue
      && props.defaultValue.label !== '-'
      && typeof props.defaultValue.label !== 'undefined'
      && typeof props.defaultValue.value !== 'undefined') setFilled(true)
  }, [props.defaultValue])

  const { axiosBase } = useAxios()

  const loadOptions = (search?: string,) => {
    return new Promise<OptionsOrGroups<{
      label: string;
      value: string;
    }, GroupBase<{
      label: string;
      value: string;
    }>>>((resolve, reject) => {
      axiosBase.get(props.urlSource!, {
        params: {
          search: search,
          limit: props.limit || 5
        }
      })
        .then((response) => {
          console.log(response.data)
          // console.log(response.data.data.map((item: never) => ({
          //   label: item[props.dataValue!.label],
          //   value: item[props.dataValue!.value]
          // })))
          if (!response.data.data.length) {
            reject([])
            return
          }
          const data: OptionsOrGroups<{
            label: string;
            value: string;
            isDisabled?: boolean;
          }, GroupBase<{
            label: string;
            value: string;
            isDisabled?: boolean;
          }>> = response.data.data.map((item: never) => ({
            label: item[props.dataValue ? props.dataValue!.label : 'label'],
            value: item[props.dataValue ? props.dataValue!.value : 'value']
          }))
          // console.log(data)
          resolve([{
            label: 'Type to search',
            value: '',
            isDisabled: true
          }, ...data.filter(e => e.label !== '-')])
        })
        .catch((error) => {
          console.log(error)
          reject([])
        })
    })
  }

  // console.log(props.options)

  return (
    <div className={styles.container + (props.containerClassName ? ` ${props.containerClassName}` : '')}>
      {filled && <label htmlFor={props.name || props.id} className={styles.labelContainer}>
        {props.label || props.placeholder}
      </label>}
      <TrueSelect
        isClearable={props.isClearable || true}
        required={props.required}
        cacheOptions={props.asynchronous}
        loadOptions={props.asynchronous ? loadOptions : undefined}
        // add intruction in select options
        defaultOptions={props.asynchronous ? true : undefined}
        // defaultOptions={props.asynchronous ? true : undefined}
        options={props.options ? props.options : (options?.length ? options : undefined)}
        // options={options}
        placeholder={props.placeholder}
        classNamePrefix={'react-select'}
        classNames={{
          container: () => container,
          input: () => '!text-base-content !text-opacity-50 !mr-auto !ml-2',
          placeholder: () => '!mr-auto !ml-2 ' + (props.required ? styles.required : ''),
          control: (con) => '!bg-base-100 h-11 !rounded-md !border-gray-500' + (con.isDisabled ? ' !bg-base-300' : ''),
          menu: () => '!bg-base-100',
          singleValue: () => '!text-base-content text-start pl-2',
          option: (condition) => {
            const inFocused = condition.isFocused ? '!bg-base-200 !text-base-content' : ''
            const inSelected = condition.isSelected ? '!bg-dark !text-dark dark:!bg-light dark:!text-light' : inFocused
            const isDisabled = condition.isDisabled ? ' !text-gray-500' : ''
            return 'text-start dark:focus:text-light ' + inSelected + isDisabled
          },
        }}
        id={props.name || props.id}
        name={props.name || props.id}
        onChange={(value) => {
          props.onChange(value as never)
          setFilled(!!value)
        }}
        onInputChange={props.onInputChange}
        onMenuOpen={async () => {
          console.log('load', props.options)
          console.log('path', props.urlSource)
          if (props.customAsync) {
            const options = await loadOptions()
            setOptions(options)
          }
        }}
        autoFocus={props.autoFocus}
        defaultValue={
          (props.defaultValue
            && 'label' in props.defaultValue
            && props.defaultValue.label !== '-'
            && typeof props.defaultValue.label !== 'undefined'
            && typeof props.defaultValue.value !== 'undefined')
            ? props.defaultValue : undefined}
        isDisabled={props.disabled}
      />
      {
        props.errorMessages?.length ? (
          <div>
            {props.errorMessages.map((message, index) => (
              <p key={index} className={`${styles.error}${props.errorClassname ? ` ${props.errorClassname}` : ''}`}>{message}</p>
            ))}
          </div>
        ) : <></>
      }
    </div>
  )
}

const Select = (props: Props) => {
  const [isLoading, setLoading] = useState(false)

  
  useEffect(() => {
    // console.log(props.urlSource)
    setLoading(true)
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 300)
    
    return () => {
      return clearTimeout(timeout)
    }
  }, [props.urlSource])
  if (isLoading) {
    return (
      <div className="skeleton"></div>
    )
  }


  // Check if there are any query parameters
  if (props.customAsync && props.urlSource && !props.urlSource.includes('?')) {
    return (
      <div className="skeleton"></div>
    )
  }


  return (
    <CustomContainer {...props} />
  )
}

export default Select