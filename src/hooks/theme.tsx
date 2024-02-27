'use client'
import { useStoreActions, useStoreState } from '@/state/hooks'
import { ChangeEvent } from 'react'
import { FaMoon } from 'react-icons/fa'
import { MdOutlineWbSunny } from 'react-icons/md'

//determines if the user has a set theme
const detectColorScheme = () => {
  if (typeof window !== 'undefined') {
    let theme = 'light'    //default to light

    //local storage is used to override OS theme settings
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      if (localStorage.getItem('theme') == 'dark') {
        theme = 'dark'
      }
    } else if (typeof window !== 'undefined' && !window.matchMedia) {
      //matchMedia method not supported
      return 'light'
    } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      //OS theme setting detected as dark
      theme = 'dark'
    }

    //dark theme preferred, set document with a `data-theme` attribute
    if (theme == 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }

    const styleElement = document.createElement('style')
    const styleContentLight = `
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
            -webkit-text-fill-color: black !important;
            }
        `
    const styleContentDark = `
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #1d232a inset !important;
            -webkit-text-fill-color: white !important;
            }
        `

    if (theme === 'dark') {
      styleElement.appendChild(document.createTextNode(styleContentDark))
    } else {
      styleElement.appendChild(document.createTextNode(styleContentLight))
    }
    document.head.appendChild(styleElement)

    return theme as 'dark' | 'light'
  }
  return 'dark'
}

const useTheme = () => {

  return {
    detectColorScheme,
  }
}

type Props = React.HTMLAttributes<HTMLDivElement> & {
  setTheme?: (theme: 'dark' | 'light') => void
}

const ToggleTheme = (props: Props) => {
  const { theme: globalTheme } = useStoreState(state => state)
  const { setTheme } = useStoreActions(actions => actions)

  const handleChangeTheme = (e: ChangeEvent<HTMLInputElement>) => {
    if (typeof window === 'undefined') return setTheme('light')
    const theme = e.target.checked ? 'dark' : 'light'
    // add data-theme
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
    window.localStorage.setItem('theme', theme)

    const styleElement = document.createElement('style')
    const styleContentLight = `
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
            -webkit-text-fill-color: black !important;
            }
        `
    const styleContentDark = `
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #1d232a inset !important;
            -webkit-text-fill-color: white !important;
            }
        `

    if (theme === 'dark') {
      styleElement.appendChild(document.createTextNode(styleContentDark))
    } else {
      styleElement.appendChild(document.createTextNode(styleContentLight))
    }
    document.head.appendChild(styleElement)

    e.target.checked = theme === 'dark'

    console.log(e.target.checked)

    setTheme(theme)

    if (props.setTheme) {
      props.setTheme(theme)
    }
  }



  return (
    // <div {...props}>
    <label className={`swap swap-rotate w-full h-full${props.className ? ` ${props.className}` : ''}`} tabIndex={0}>
      {/* this hidden checkbox controls the state */}
      <input
        type="checkbox"
        className="theme-controller invisible"
        checked={globalTheme == 'dark'}
        onChange={handleChangeTheme}
      />
      {/* sun icon */}
      <span className='swap-off'>
        <MdOutlineWbSunny size={24} color={'#000000'} />
      </span>
      {/* moon icon */}
      <span className='swap-on'>
        <FaMoon size={24} color={'#ffffff'} />
      </span>
    </label>
  )
}

export { ToggleTheme, detectColorScheme }

export default useTheme