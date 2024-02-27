import Link from 'next/link'
import styles from './navbar.module.css'
import Sidebar from './sidebar'

const Navbar = () => {
  return (
    <nav className={styles.container}>
      <Sidebar />
      <Link href='/' className={styles.title} >
        {process.env.NEXT_PUBLIC_APP_NAME}
      </Link>
    </nav>
  )
}

export default Navbar