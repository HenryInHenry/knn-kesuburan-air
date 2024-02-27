import { BsInfo } from 'react-icons/bs'
import styles from './procedure.module.css'
import withReactContent from 'sweetalert2-react-content'
import Swal from 'sweetalert2'
import { ReactNode, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import Process from '@/types/procedure'
import { Controller, Virtual } from 'swiper/modules'
import { ControllerOptions, Swiper as SwiperType } from 'swiper/types'
import Carousel, { ButtonGroupProps } from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'

type Props = {
  process: Process[]
}

const Steps = (props: ButtonGroupProps & Props) => {
  return (
    <ul className="steps steps-horizontal order-[-1]">
      {props.process.map((e, idx) => (
        <li
          key={idx}
          className={`step text-sm hover:cursor-pointer${idx<=props.carouselState?.currentSlide! ? ' step-primary' : ''}`}
          onClick={() => {
            console.log(idx)
            props.goToSlide!(idx)
          }}
        >
          {e.title}
        </li>
      ))}
    </ul>
  )
}

const Procedure = (props: Props) => {
  const ReactSwal = withReactContent(Swal)
  const [step, setStep] = useState(0)
  const [slides, setSlides] = useState<ReactNode[]>(props.process.map((row) => row.content as ReactNode))

  const handleClick = () => {
    ReactSwal.fire({
      title: 'Tahapan Langkah per Langkah',
      customClass: {
        popup: styles.popup
      },
      width: 1000,
      html: (
        <div
          className='flex flex-col'
        >
          {/* <Steps process={props.process} step={step} setStep={setStep} /> */}
          
          <Carousel
            responsive={{ desktop: { items: 1, breakpoint: { min: 0, max: 10000 } } }}
            customButtonGroup={<Steps process={props.process} />}
            arrows={false}
            renderButtonGroupOutside
          >
            {props.process.map((e, idx) => (
              <div key={idx}>
                {e.content}
              </div>
            ))}
          </Carousel>
        </div>
      )
    })
  }

  return (
    <button
      type='button'
      className={styles.container}
      onClick={handleClick}
    >
      <BsInfo size={44} />
    </button>
  )
}

export default Procedure