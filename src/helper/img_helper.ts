import type { StaticImageData } from 'next/image';
import jai_logo from '../../public/logo/jai-logo.png';

const ImgHelper: Record<string, Record<string, StaticImageData>> = {
  logo: {
    jai_logo,
  },
};

export default ImgHelper;
