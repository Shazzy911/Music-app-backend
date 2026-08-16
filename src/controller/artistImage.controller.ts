import { Request, Response } from "express";
import prisma from "../lib/prisma";
import supabase from "../lib/supabaseClient";
import { IFile } from "../types/file.type";

export const createArtistImages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const artistId = req.params.artistId;
    const files = req.files as IFile[];

    if (!artistId) {
      res.status(400).json({
        success: false,
        message: "Artist ID is required",
      });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
      return;
    }

    const artist = await prisma.artist.findUnique({
      where: {
        id: artistId,
      },
    });

    if (!artist) {
      res.status(404).json({
        success: false,
        message: "Artist not found",
      });
      return;
    }

    // Upload all images concurrently
    const imageData = await Promise.all(
      files.map(async (file, index) => {
        const fileName = `${Date.now()}-${file.originalname}`;

        const { data, error } = await supabase.storage
          .from("music-store")
          .upload(
            `images/artist/${artist.name}/covers/${fileName}`,
            file.buffer,
            {
              contentType: file.mimetype,
              cacheControl: "3600",
              upsert: false,
            },
          );

        if (error) {
          throw new Error(error.message);
        }

        const { data: publicUrl } = supabase.storage
          .from("music-store")
          .getPublicUrl(data.path);

        return {
          artistId,
          url: publicUrl.publicUrl,
          order: index,
        };
      }),
    );

    await prisma.artistImage.createMany({
      data: imageData,
    });

    res.status(201).json({
      success: true,
      data: imageData,
      message: "Artist images uploaded successfully",
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
    return;
  }
};
