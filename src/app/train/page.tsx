import globalStyles from '@/app/global.module.css'
import Client from '@/components/client'
import Train from '@/components/train'

const TrainPage = () => {
  return (
    <>
      <Client>
        <Train />
      </Client>
    </>
  )
}

export default TrainPage