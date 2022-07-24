import {
    HttpException,
} from '@nestjs/common';


export interface TMP {
    id?: string;
}
  
export const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return callback(new HttpException('Only image files are allowed!', 409), false);
    }
    callback(null, true);
};
