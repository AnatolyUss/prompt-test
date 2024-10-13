import { NestInterceptor, ParseFilePipe, ParseFilePipeBuilder, Type } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export const getFileInterceptor = (): Type<NestInterceptor> => {
  return FileInterceptor(process.env.HTML_FILE_FIELD_NAME as string, {
    limits: {
      files: 1, // In multipart forms, the max number of file fields.
    },
  });
};

export const getParseFilePipeBuilder = (): ParseFilePipe => {
  return new ParseFilePipeBuilder()
    .addFileTypeValidator({ fileType: 'application/pdf' })
    .addMaxSizeValidator({
      maxSize: 512 * 1024 * 1024,
      message: 'Exceeded max file size of 512 MB',
    })
    .build({
      errorHttpStatusCode: 400,
      fileIsRequired: true,
    });
};
