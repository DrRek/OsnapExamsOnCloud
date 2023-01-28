import { BreadcrumbGroup } from '@cloudscape-design/components';
import { useHistory } from 'react-router-dom';
import { navigate } from '../utils/navigation';

export const Breadcrumbs = ({items}) => {
  const history = useHistory()

  return (
    <BreadcrumbGroup
      items={[
        { text: 'ExamsOnTheCloud', href: '/' },
        ...items
      ]}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
      onFollow={(evt) => navigate(evt, history)}
    />
  )
}