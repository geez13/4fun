-- Insert sample generated images for testing V Wall
INSERT INTO generated_images (
  owner_pubkey,
  image_url,
  thumbnail_url,
  generated_image_url,
  style,
  visible,
  is_public,
  prompt,
  aspect_ratio,
  optimized_url
) VALUES 
(
  'test_user_1',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20landscape%20with%20mountains%20and%20lake&image_size=landscape_4_3',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20landscape%20with%20mountains%20and%20lake&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20landscape%20with%20mountains%20and%20lake&image_size=landscape_4_3',
  'realistic',
  true,
  true,
  'beautiful landscape with mountains and lake',
  1.33,
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20landscape%20with%20mountains%20and%20lake&image_size=landscape_4_3'
),
(
  'test_user_2',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20city%20skyline%20at%20sunset&image_size=landscape_16_9',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20city%20skyline%20at%20sunset&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20city%20skyline%20at%20sunset&image_size=landscape_16_9',
  'realistic',
  true,
  true,
  'futuristic city skyline at sunset',
  1.78,
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20city%20skyline%20at%20sunset&image_size=landscape_16_9'
),
(
  'test_user_3',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20cat%20playing%20with%20yarn&image_size=square_hd',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20cat%20playing%20with%20yarn&image_size=square',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20cat%20playing%20with%20yarn&image_size=square_hd',
  'cartoon',
  true,
  true,
  'cute cartoon cat playing with yarn',
  1.0,
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20cat%20playing%20with%20yarn&image_size=square_hd'
);