import Link from 'next/link'
import { MdClose, MdMenu } from 'react-icons/md'
import styles from './sidebar.module.css'
import NavLink from './navlink'

const Sidebar = () => {
  const closeDrawer = () => {
    if (window) {
      const drawer = document.getElementById('my-drawer') as HTMLInputElement
      if (drawer) {
        drawer.checked = false
      }
    }
  }

  return (
    <div className={styles.container}>
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {/* Page content here */}
        <label htmlFor="my-drawer" className={styles.drawerButton} role='button'>
          <MdMenu size={32} />
        </label>
      </div>
      <div className="drawer-side">
        <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className={styles.menuList}>
          <li>
            <label htmlFor="my-drawer" className={styles.drawerButtonClose} role='button'>
              <MdClose size={32} />
            </label>
          </li>
          <li>
            <NavLink href={'/'} inputId='my-drawer'>
              Data
            </NavLink>
          </li>
          <li>
            <NavLink href={'/train'} inputId='my-drawer'>
              Data Latih
            </NavLink>
          </li>
          <li>
            <NavLink href={'/test'} inputId='my-drawer'>
              Data Uji
            </NavLink>
          </li>
          <li>
            <NavLink href={'/predict'} inputId='my-drawer'>
              Data Prediksi
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar