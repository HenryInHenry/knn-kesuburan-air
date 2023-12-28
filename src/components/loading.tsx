type Props = {
  size: 'xs' | 'sm' | 'md' | 'lg'
}

const Loading = (props: Props) => {
  return (
    <span className={`loading loading-spinner loading-${props.size}`}></span>
  )
}

export default Loading