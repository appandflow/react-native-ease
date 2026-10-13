import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function Illustration({
  file,
  alt = '',
  ...props
}: Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & { file: string }) {
  return <img src={useBaseUrl(`/img/landing/${file}`)} alt={alt} {...props} />;
}
