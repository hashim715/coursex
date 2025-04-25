export const groupImageMessages = (messages) => {
  const processedMessages = [];
  let imageGroup = null;

  for (const message of messages) {
    if (message.type === "image" && !message.grouped) {
      if (!imageGroup || imageGroup.timeStamp !== message.timeStamp) {
        if (imageGroup) {
          if (imageGroup.images.length > 3) {
            processedMessages.push(imageGroup);
          } else {
            processedMessages.push(
              ...imageGroup.images.map((img) => ({ ...img, grouped: false }))
            );
          }
        }

        imageGroup = {
          type: "image",
          images: [],
          grouped: true,
          timeStamp: message.timeStamp,
        };
      }

      imageGroup.images.push({
        sender: message.sender,
        groupId: message.groupId,
        _id: message._id,
        message: message.message,
        timeStamp: message.timeStamp,
        type: message.type,
        image: message.image,
        status: message.status,
        error: message.error,
        image_data: message.image_data,
      });
    } else {
      if (imageGroup) {
        if (imageGroup.images.length > 3) {
          processedMessages.push(imageGroup);
        } else {
          processedMessages.push(
            ...imageGroup.images.map((img) => ({ ...img, grouped: false }))
          );
        }
        imageGroup = null;
      }
      processedMessages.push(message);
    }
  }

  if (imageGroup) {
    if (imageGroup.images.length > 3) {
      processedMessages.push(imageGroup);
    } else {
      processedMessages.push(
        ...imageGroup.images.map((img) => ({ ...img, grouped: false }))
      );
    }
  }

  return processedMessages;
};
