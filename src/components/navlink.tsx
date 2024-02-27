'use client'
import Link, { LinkProps } from 'next/link'
import { HTMLAttributes, ReactNode } from 'react'

type Props = LinkProps & HTMLAttributes<HTMLElement> & {
  children: ReactNode
  inputId?: string
}

const NavLink = ({ inputId, ...props }: Props) => {
  return (
    <Link className='px-5 h-full flex items-center' {...props} onClick={() => document.getElementById(inputId || '')?.click()}>
      {props.children}
    </Link>
  )
}

export default NavLink