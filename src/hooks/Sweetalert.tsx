import { useStoreState } from '@/state/hooks'
import Colors from '@/variables/colors'
import Swal, { SweetAlertOptions } from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

interface Params {
  [x: string]: SweetAlertOptions<unknown, unknown>
}

const SweetalertParams: Params = {
  error: {
    icon: 'error',
    showCancelButton: true,
    confirmButtonColor: Colors.error,
    reverseButtons: true,
  },
  success: {
    icon: 'success',
    confirmButtonColor: Colors.success,
  },
  form: {
    showCancelButton: false,
    showConfirmButton: false,
    reverseButtons: true,
    confirmButtonColor: Colors.primary,
  },
  delete: {
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: Colors.error,
    reverseButtons: true,
    confirmButtonText: 'Delete',
    customClass: {
      cancelButton: 'border1'
    },
  },
  detail: {
    showCancelButton: false,
    showConfirmButton: false,
    confirmButtonColor: Colors.primary,
    showCloseButton: true,
  },
  confirm: {
    showCancelButton: true,
    confirmButtonColor: Colors.primary,
    reverseButtons: true,
    showCloseButton: false,
    customClass: {
      htmlContainer: '!z-10'
    }
  }
}

type Type = 'error' | 'success' | 'form' | 'delete' | 'loading' | 'detail' | 'image' | 'confirm'

const useSwal = () => {
  const { theme } = useStoreState(state => state)
  const ReactSwal = withReactContent(Swal)

  return {
    Swal: async (props: {type: Type, options?: SweetAlertOptions}) => {
      const a = SweetalertParams[props.type]

      return await ReactSwal.fire({
        ...a,
        ...props.options,
        background: theme === 'dark' ? Colors.bgDark : Colors.bgLight,
        color: theme === 'dark' ? Colors.textDark : Colors.textLight,
      })
    },
    SwalDefault: Swal,
  }
}

export default useSwal