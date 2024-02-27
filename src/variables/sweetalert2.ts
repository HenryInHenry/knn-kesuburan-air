import { SweetAlertOptions } from 'sweetalert2'
import Colors from './colors'
import styles from './sweetalert2.module.css'

interface Params {
  [x: string]: SweetAlertOptions<unknown, unknown>
}

const SweetalertParams: Params = {
  error: {
    confirmButtonColor: Colors.error,
    icon: 'error',
    title: 'Error',
    confirmButtonText: 'Close',
  },
  info: {
    confirmButtonColor: Colors.info,
    icon: 'info',
    title: 'Info',
    confirmButtonText: 'Close',
    showCloseButton: true,
  },
  success: {
    confirmButtonColor: Colors.success,
    icon: 'success',
    title: 'Success',
    confirmButtonText: 'Close',
  },
  form: {
    showConfirmButton: false,
    showCloseButton: true,
  },
  loading: {
    showConfirmButton: false,
    showCloseButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
  }
}

export default SweetalertParams