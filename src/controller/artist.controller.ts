import { Request, Response } from "express";
// import { decode } from "base64-arraybuffer";
import prisma from "../lib/prisma";
import { IFile } from "../types/file.type";
import supabase from "../lib/supabaseClient";

/* =========================
   GET ALL ARTISTS
========================= */
const getAllArtist = async (req: Request, resp: Response): Promise<void> => {
  try {
    const artists = await prisma.artist.findMany();

    if (artists.length === 0) {
      resp.status(404).json({
        success: false,
        data: [],
        message: "No artists found",
      });
      return;
    }

    resp.status(200).json({
      success: true,
      data: artists,
      message: "Artists fetched successfully",
    });
  } catch (error) {
    resp.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/* =========================
   CREATE ARTIST
========================= */
const createArtist = async (req: Request, resp: Response): Promise<void> => {
  try {
    const { name, genre, bio } = req.body;

    if (!name || !genre || !bio) {
      resp.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    const file = req.file as IFile;

    if (!file) {
      resp.status(400).json({
        success: false,
        message: "Image file is required",
      });
      return;
    }

    // const fileBase64 = decode(file.buffer.toString("base64"));
    const fileBuffer = file.buffer;

    const fileName = `${Date.now()}-${file.originalname}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from("music-store")
      .upload(`images/artist/${name}/${fileName}`, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      resp.status(500).json({
        success: false,
        message: "Error uploading image to Supabase",
        error: storageError.message,
      });
      return;
    }

    if (!storageData) {
      resp.status(500).json({
        success: false,
        message: "Upload failed, no storage data returned",
      });
      return;
    }

    const imageUrl = supabase.storage
      .from("music-store")
      .getPublicUrl(storageData.path);

    const artist = await prisma.artist.create({
      data: {
        name,
        genre,
        bio,
        img: imageUrl.data.publicUrl,
      },
    });

    resp.status(201).json({
      success: true,
      data: artist,
      message: "Artist created successfully",
    });
  } catch (error) {
    resp.status(500).json({
      success: false,
      message: "Error creating artist",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/* =========================
   GET ARTIST BY ID
========================= */
const getArtistById = async (req: Request, resp: Response): Promise<void> => {
  try {
    const artistId = req.params.id;

    if (!artistId) {
      resp.status(400).json({
        success: false,
        message: "Artist ID is required",
      });
      return;
    }
    const artist = await prisma.artist.findUnique({
      where: {
        id: artistId,
      },

      select: {
        id: true,
        name: true,
        genre: true,
        bio: true,
        img: true,

        images: {
          select: {
            id: true,
            url: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },

        songs: {
          select: {
            id: true,
            title: true,
            duration: true,
            img: true,
            genre: true,
            songUrl: true,
            releaseDate: true,
            isExplicit: true,
            playCount: true,
            likes: true,

            // ✅ THIS IS THE KEY FIX
            album: {
              select: {
                id: true,
                title: true,
                img: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        },

        _count: {
          select: {
            songs: true,
          },
        },
      },
    });

    if (!artist) {
      resp.status(404).json({
        success: false,
        data: null,
        message: "Artist not found",
      });
      return;
    }

    resp.status(200).json({
      success: true,
      data: artist,
      message: "Artist fetched successfully",
    });
  } catch (error) {
    resp.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/* =========================
   UPDATE ARTIST
========================= */
const updateArtistById = async (
  req: Request,
  resp: Response,
): Promise<void> => {
  try {
    const artistId = req.params.id;
    const body = req.body;

    if (!artistId) {
      resp.status(400).json({
        success: false,
        message: "Artist ID is required",
      });
      return;
    }

    const existingArtist = await prisma.artist.findUnique({
      where: { id: artistId },
    });

    if (!existingArtist) {
      resp.status(404).json({
        success: false,
        data: null,
        message: "Artist not found",
      });
      return;
    }

    const updatedArtist = await prisma.artist.update({
      where: { id: artistId },
      data: { ...body },
    });

    resp.status(200).json({
      success: true,
      data: updatedArtist,
      message: "Artist updated successfully",
    });
  } catch (error) {
    resp.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/* =========================
   DELETE ARTIST
========================= */
const deleteArtistById = async (
  req: Request,
  resp: Response,
): Promise<void> => {
  try {
    const artistId = req.params.id;

    if (!artistId) {
      resp.status(400).json({
        success: false,
        message: "Artist ID is required",
      });
      return;
    }

    const existingArtist = await prisma.artist.findUnique({
      where: { id: artistId },
    });

    if (!existingArtist) {
      resp.status(404).json({
        success: false,
        data: null,
        message: "Artist not found",
      });
      return;
    }

    const deletedArtist = await prisma.artist.delete({
      where: { id: artistId },
    });

    resp.status(200).json({
      success: true,
      data: deletedArtist,
      message: "Artist deleted successfully",
    });
  } catch (error) {
    resp.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export {
  getAllArtist,
  createArtist,
  getArtistById,
  updateArtistById,
  deleteArtistById,
};
